import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  MoreVertical,
  ChevronRight,
  MessageSquare,
  Paperclip,
  User,
  Calendar,
  Tag,
  ArrowRight,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Textarea, Badge, Modal, Alert, Tabs, Switch, Avatar, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  type: 'task' | 'research' | 'development' | 'automation' | 'analysis';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'review' | 'completed' | 'rejected' | 'cancelled';
  progress: number;
  estimatedCredits: number;
  actualCredits?: number;
  requestedBy: { id: number; name: string; email: string };
  approvedBy?: { id: number; name: string };
  assignedTo?: string;
  tags: string[];
  attachments: { name: string; url: string }[];
  comments: WorkOrderComment[];
  timeline: WorkOrderEvent[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface WorkOrderComment {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: Date;
}

interface WorkOrderEvent {
  id: number;
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'started' | 'paused' | 'completed' | 'comment';
  description: string;
  userId?: number;
  userName?: string;
  createdAt: Date;
}

const typeOptions = [
  { value: 'task', label: 'General Task' },
  { value: 'research', label: 'Research' },
  { value: 'development', label: 'Development' },
  { value: 'automation', label: 'Automation' },
  { value: 'analysis', label: 'Data Analysis' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
];

export default function WorkOrders() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newComment, setNewComment] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    tags: '',
    dueDate: '',
  });

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      // Mock data
      setWorkOrders([
        {
          id: 1,
          title: 'Build Customer Dashboard',
          description: 'Create a comprehensive dashboard showing customer metrics, engagement stats, and revenue trends. Include interactive charts and export functionality.',
          type: 'development',
          priority: 'high',
          status: 'in_progress',
          progress: 65,
          estimatedCredits: 500,
          actualCredits: 320,
          requestedBy: { id: 1, name: user?.name || 'User', email: user?.email || '' },
          approvedBy: { id: 2, name: 'Admin' },
          assignedTo: 'ADELE',
          tags: ['dashboard', 'analytics', 'react'],
          attachments: [{ name: 'requirements.pdf', url: '#' }],
          comments: [
            { id: 1, userId: 1, userName: 'User', content: 'Please prioritize the revenue chart', createdAt: new Date(Date.now() - 3600000) },
          ],
          timeline: [
            { id: 1, type: 'created', description: 'Work order created', createdAt: new Date(Date.now() - 86400000 * 2) },
            { id: 2, type: 'submitted', description: 'Submitted for approval', createdAt: new Date(Date.now() - 86400000 * 2) },
            { id: 3, type: 'approved', description: 'Approved by Admin', userName: 'Admin', createdAt: new Date(Date.now() - 86400000) },
            { id: 4, type: 'started', description: 'Work started', createdAt: new Date(Date.now() - 86400000) },
          ],
          dueDate: new Date(Date.now() + 86400000 * 3),
          createdAt: new Date(Date.now() - 86400000 * 2),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Research Competitor Pricing',
          description: 'Analyze competitor pricing strategies and create a comparison report.',
          type: 'research',
          priority: 'medium',
          status: 'pending_approval',
          progress: 0,
          estimatedCredits: 200,
          requestedBy: { id: 1, name: user?.name || 'User', email: user?.email || '' },
          tags: ['research', 'pricing'],
          attachments: [],
          comments: [],
          timeline: [
            { id: 1, type: 'created', description: 'Work order created', createdAt: new Date(Date.now() - 3600000) },
            { id: 2, type: 'submitted', description: 'Submitted for approval', createdAt: new Date(Date.now() - 3600000) },
          ],
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: 3,
          title: 'Automate Report Generation',
          description: 'Set up automated weekly report generation and email distribution.',
          type: 'automation',
          priority: 'low',
          status: 'completed',
          progress: 100,
          estimatedCredits: 150,
          actualCredits: 142,
          requestedBy: { id: 1, name: user?.name || 'User', email: user?.email || '' },
          approvedBy: { id: 2, name: 'Admin' },
          assignedTo: 'ADELE',
          tags: ['automation', 'reports'],
          attachments: [],
          comments: [],
          timeline: [
            { id: 1, type: 'created', description: 'Work order created', createdAt: new Date(Date.now() - 86400000 * 7) },
            { id: 2, type: 'completed', description: 'Work completed', createdAt: new Date(Date.now() - 86400000 * 5) },
          ],
          createdAt: new Date(Date.now() - 86400000 * 7),
          updatedAt: new Date(Date.now() - 86400000 * 5),
          completedAt: new Date(Date.now() - 86400000 * 5),
        },
      ]);
    } catch (error) {
      console.error('Failed to load work orders:', error);
      toast.error('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.workOrders.create({
        title: form.title,
        description: form.description,
        type: form.type,
        priority: form.priority,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });
      toast.success('Work order created');
      setShowCreateModal(false);
      setForm({ title: '', description: '', type: 'task', priority: 'medium', tags: '', dueDate: '' });
      loadWorkOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create work order');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await api.workOrders.approve(selectedOrder.id, approved);
      toast.success(`Work order ${approved ? 'approved' : 'rejected'}`);
      setShowApprovalModal(false);
      loadWorkOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update work order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedOrder || !newComment.trim()) return;
    try {
      await api.workOrders.addComment(selectedOrder.id, newComment);
      setNewComment('');
      // Refresh order details
      const updated = { ...selectedOrder };
      updated.comments.push({
        id: Date.now(),
        userId: user?.id || 0,
        userName: user?.name || 'User',
        content: newComment,
        createdAt: new Date(),
      });
      setSelectedOrder(updated);
      toast.success('Comment added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const handleCancel = async (orderId: number) => {
    try {
      await api.workOrders.cancel(orderId);
      toast.success('Work order cancelled');
      loadWorkOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel work order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'info';
      case 'in_progress': return 'info';
      case 'review': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const filteredOrders = workOrders.filter((order) => {
    const matchesSearch =
      searchQuery === '' ||
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'my' && order.requestedBy.id === user?.id) ||
      (activeTab === 'pending' && order.status === 'pending_approval');
    return matchesSearch && matchesStatus && matchesTab;
  });

  const tabs = [
    { id: 'all', label: 'All Orders', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'my', label: 'My Requests', icon: <User className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending Approval', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Work Orders"
          description="Request and track tasks for ADELE to complete"
          actions={
            <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
              New Work Order
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            options={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
          />
        </div>

        {/* Work Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Work Orders</h3>
              <p className="text-zinc-400 mb-6">
                Create a work order to request ADELE to complete a task
              </p>
              <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
                New Work Order
              </Button>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:border-zinc-700 transition-colors"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white">{order.title}</h3>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={getPriorityColor(order.priority) as any} size="sm">
                        {order.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{order.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {typeOptions.find((t) => t.value === order.type)?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {order.requestedBy.name}
                      </span>
                      {order.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due {order.dueDate.toLocaleDateString()}
                        </span>
                      )}
                      <span>~{order.estimatedCredits} credits</span>
                    </div>
                  </div>
                  {order.status === 'in_progress' && (
                    <div className="lg:w-32">
                      <Progress value={order.progress} max={100} />
                      <p className="text-xs text-zinc-500 text-center mt-1">{order.progress}%</p>
                    </div>
                  )}
                  {order.status === 'pending_approval' && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowApprovalModal(true);
                        }}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="New Work Order"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of the task"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed requirements and expectations..."
              className="min-h-[120px]"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Type"
                options={typeOptions}
                value={form.type}
                onChange={(value) => setForm({ ...form, type: value })}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={form.priority}
                onChange={(value) => setForm({ ...form, priority: value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
                hint="Comma-separated tags"
              />
              <Input
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <Alert variant="info">
              Work orders require approval before ADELE begins work. You'll be notified when approved.
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Submit for Approval
              </Button>
            </div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedOrder?.title || ''}
          size="xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(selectedOrder.status) as any}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(selectedOrder.priority) as any}>
                    {selectedOrder.priority}
                  </Badge>
                  <Badge>{typeOptions.find((t) => t.value === selectedOrder.type)?.label}</Badge>
                </div>
                <div className="text-sm text-zinc-500">
                  #{selectedOrder.id}
                </div>
              </div>

              {/* Progress */}
              {selectedOrder.status === 'in_progress' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Progress</span>
                    <span className="text-sm text-white">{selectedOrder.progress}%</span>
                  </div>
                  <Progress value={selectedOrder.progress} max={100} />
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-medium text-white mb-2">Description</h4>
                <p className="text-zinc-300">{selectedOrder.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-zinc-500">Requested By</span>
                  <p className="text-white">{selectedOrder.requestedBy.name}</p>
                </div>
                {selectedOrder.approvedBy && (
                  <div>
                    <span className="text-sm text-zinc-500">Approved By</span>
                    <p className="text-white">{selectedOrder.approvedBy.name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-zinc-500">Estimated Credits</span>
                  <p className="text-white">{selectedOrder.estimatedCredits}</p>
                </div>
                {selectedOrder.actualCredits && (
                  <div>
                    <span className="text-sm text-zinc-500">Actual Credits</span>
                    <p className="text-white">{selectedOrder.actualCredits}</p>
                  </div>
                )}
                {selectedOrder.dueDate && (
                  <div>
                    <span className="text-sm text-zinc-500">Due Date</span>
                    <p className="text-white">{selectedOrder.dueDate.toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-zinc-500">Created</span>
                  <p className="text-white">{selectedOrder.createdAt.toLocaleString()}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedOrder.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.tags.map((tag) => (
                      <Badge key={tag} size="sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-white mb-3">Timeline</h4>
                <div className="space-y-3">
                  {selectedOrder.timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full mt-2',
                        event.type === 'completed' ? 'bg-green-400' :
                        event.type === 'rejected' ? 'bg-red-400' :
                        'bg-blue-400'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{event.description}</p>
                        <p className="text-xs text-zinc-500">
                          {event.createdAt.toLocaleString()}
                          {event.userName && ` by ${event.userName}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-medium text-white mb-3">Comments</h4>
                <div className="space-y-3 mb-4">
                  {selectedOrder.comments.length === 0 ? (
                    <p className="text-sm text-zinc-500">No comments yet</p>
                  ) : (
                    selectedOrder.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-zinc-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar name={comment.userName} size="sm" />
                          <span className="text-sm font-medium text-white">{comment.userName}</span>
                          <span className="text-xs text-zinc-500">
                            {comment.createdAt.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 pl-8">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Send
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                {selectedOrder.status === 'pending_approval' && (
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(selectedOrder.id)}
                  >
                    Cancel Request
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Approval Modal */}
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="Review Work Order"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-xl">
                <h4 className="font-medium text-white mb-2">{selectedOrder.title}</h4>
                <p className="text-sm text-zinc-400">{selectedOrder.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Type</span>
                  <p className="text-white">{typeOptions.find((t) => t.value === selectedOrder.type)?.label}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Priority</span>
                  <p className="text-white capitalize">{selectedOrder.priority}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Estimated Credits</span>
                  <p className="text-white">{selectedOrder.estimatedCredits}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Requested By</span>
                  <p className="text-white">{selectedOrder.requestedBy.name}</p>
                </div>
              </div>

              <Alert variant="info">
                Approving this work order will allow ADELE to begin working on it immediately.
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleApprove(false)}
                  loading={loading}
                  icon={<ThumbsDown className="w-4 h-4" />}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(true)}
                  loading={loading}
                  icon={<ThumbsUp className="w-4 h-4" />}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
