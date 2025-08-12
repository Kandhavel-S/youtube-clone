import Group from "../Modals/group.js";
import User from "../Modals/Auth.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, tags } = req.body;
    const userId = req.user.id;

    const newGroup = new Group({
      name,
      description,
      creator: userId,
      members: [userId],
      isPrivate: isPrivate || false,
      tags: tags || []
    });

    const savedGroup = await newGroup.save();

    // Add group to user's groupsCreated array
    await User.findByIdAndUpdate(userId, {
      $push: { groupsCreated: savedGroup._id, groups: savedGroup._id }
    });

    const populatedGroup = await Group.findById(savedGroup._id)
      .populate('creator', 'name email channelname image')
      .populate('members', 'name email channelname image');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
};

// Search groups
export const searchGroups = async (req, res) => {
  try {
    const { query, tags, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let searchFilter = { isPrivate: false };

    if (query) {
      searchFilter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      searchFilter.tags = { $in: tagArray };
    }

    const groups = await Group.find(searchFilter)
      .populate('creator', 'name channelname image')
      .populate('members', 'name channelname image')
      .sort({ memberCount: -1, createdOn: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalGroups = await Group.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      groups,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalGroups / limit),
        totalGroups,
        hasMore: skip + groups.length < totalGroups
      }
    });
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to search groups' });
  }
};

// Join group by invite code
export const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already a member of this group' });
    }

    // Add user to group
    group.members.push(userId);
    await group.save();

    // Add group to user's groups array
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name email channelname image')
      .populate('members', 'name email channelname image');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group',
      group: populatedGroup
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ success: false, message: 'Failed to join group' });
  }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate({
        path: 'groups',
        populate: {
          path: 'creator members',
          select: 'name channelname image'
        }
      })
      .populate({
        path: 'groupsCreated',
        populate: {
          path: 'creator members',
          select: 'name channelname image'
        }
      });

    res.status(200).json({
      success: true,
      joinedGroups: user.groups,
      createdGroups: user.groupsCreated
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user groups' });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.creator.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Group creator cannot leave. Delete the group instead.' });
    }

    // Remove user from group
    group.members = group.members.filter(memberId => memberId.toString() !== userId);
    await group.save();

    // Remove group from user's groups array
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
};

// Delete group (only creator can delete)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only group creator can delete the group' });
    }

    // Remove group from all members' groups arrays
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    // Remove group from creator's groupsCreated array
    await User.findByIdAndUpdate(userId, {
      $pull: { groupsCreated: groupId }
    });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
};
