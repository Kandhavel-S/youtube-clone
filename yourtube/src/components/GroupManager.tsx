import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import axiosInstance from '../lib/axiosinstance';
import { toast } from 'sonner';
import { useTheme } from './ThemeProvider';

interface Group {
  _id: string;
  name: string;
  description: string;
  creator: {
    _id: string;
    name: string;
    channelname: string;
    image: string;
  };
  members: any[];
  inviteCode: string;
  isPrivate: boolean;
  memberCount: number;
  createdOn: string;
  tags: string[];
}

interface GroupState {
  joined: Group[];
  created: Group[];
}

const GroupManager = () => {
  const { theme } = useTheme();
  const [groups, setGroups] = useState<GroupState>({ joined: [], created: [] });
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false,
    tags: ''
  });

  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const response = await axiosInstance.get('/group/user-groups');
      if (response.data.success) {
        setGroups({
          joined: response.data.joinedGroups,
          created: response.data.createdGroups
        });
      }
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
    }
  };

  const searchGroups = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/group/search?query=${searchQuery}`);
      if (response.data.success) {
        setSearchResults(response.data.groups);
      }
    } catch (error) {
      toast.error('Failed to search groups');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setLoading(true);
    try {
      const groupData = {
        ...newGroup,
        tags: newGroup.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await axiosInstance.post('/group/create', groupData);
      if (response.data.success) {
        toast.success('Group created successfully!');
        setIsCreateDialogOpen(false);
        setNewGroup({ name: '', description: '', isPrivate: false, tags: '' });
        fetchUserGroups();
      }
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/group/join', { inviteCode: joinCode });
      if (response.data.success) {
        toast.success('Successfully joined the group!');
        setIsJoinDialogOpen(false);
        setJoinCode('');
        fetchUserGroups();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const response = await axiosInstance.delete(`/group/leave/${groupId}`);
      if (response.data.success) {
        toast.success('Left the group successfully');
        fetchUserGroups();
      }
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const response = await axiosInstance.delete(`/group/delete/${groupId}`);
      if (response.data.success) {
        toast.success('Group deleted successfully');
        fetchUserGroups();
      }
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Groups
        </h1>
        <div className="space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={newGroup.tags}
                  onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                  />
                  <span>Private Group</span>
                </label>
                <Button onClick={createGroup} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Join Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button onClick={joinGroup} disabled={loading} className="w-full">
                  {loading ? 'Joining...' : 'Join Group'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Groups */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Groups</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchGroups()}
          />
          <Button onClick={searchGroups} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((group) => (
              <div key={group._id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Members: {group.memberCount} | Creator: {group.creator.name}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Invite Code: {group.inviteCode}
                </p>
                <Button size="sm" onClick={() => setJoinCode(group.inviteCode)}>
                  Use Code
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User's Groups */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Joined Groups */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Joined Groups ({groups.joined.length})</h2>
          <div className="space-y-3">
            {groups.joined.map((group) => (
              <div key={group._id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Members: {group.memberCount} | Creator: {group.creator.name}
                </p>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => leaveGroup(group._id)}
                >
                  Leave
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Created Groups */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Created Groups ({groups.created.length})</h2>
          <div className="space-y-3">
            {groups.created.map((group) => (
              <div key={group._id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Members: {group.memberCount} | Invite Code: {group.inviteCode}
                </p>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => deleteGroup(group._id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManager;
