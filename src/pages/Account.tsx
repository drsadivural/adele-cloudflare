import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Building2,
  Globe,
  Camera,
  Shield,
  Key,
  Smartphone,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  Copy,
  RefreshCw,
  Clock,
  MapPin,
  Monitor,
  AlertTriangle,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Tabs, Badge, Modal, Avatar, Alert, Switch, Divider } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  current: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending';
  joinedAt?: Date;
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export default function Account() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: '',
    timezone: 'UTC',
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Invite form state
  const [invite, setInvite] = useState({
    email: '',
    role: 'member',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        organization: (user as any).organization || '',
        timezone: (user as any).timezone || 'UTC',
      });
    }
    loadSessions();
    loadTeamMembers();
  }, [user]);

  const loadSessions = async () => {
    try {
      // Mock sessions data
      setSessions([
        {
          id: '1',
          device: 'MacBook Pro',
          browser: 'Chrome 120',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.1',
          lastActive: new Date(),
          current: true,
        },
        {
          id: '2',
          device: 'iPhone 15',
          browser: 'Safari Mobile',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.2',
          lastActive: new Date(Date.now() - 3600000),
          current: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Mock team members
      setTeamMembers([
        {
          id: 1,
          name: user?.name || 'You',
          email: user?.email || '',
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.users.update(profile);
      await refreshUser?.();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword(passwords.current, passwords.new);
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.auth.revokeSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session revoked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.auth.revokeAllSessions();
      setSessions(sessions.filter((s) => s.current));
      toast.success('All other sessions revoked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke sessions');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.auth.setup2FA();
      setQrCode(response.qrCode);
      setTotpSecret(response.secret);
      setShow2FAModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      const response = await api.auth.verify2FA(verificationCode);
      setRecoveryCodes(response.recoveryCodes);
      setShow2FAModal(false);
      setShowRecoveryCodesModal(true);
      await refreshUser?.();
      toast.success('Two-factor authentication enabled');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await api.auth.disable2FA();
      await refreshUser?.();
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.team.invite(invite.email, invite.role);
      setShowInviteModal(false);
      setInvite({ email: '', role: 'member' });
      loadTeamMembers();
      toast.success('Invitation sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: number) => {
    try {
      await api.team.remove(memberId);
      loadTeamMembers();
      toast.success('Team member removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove team member');
    }
  };

  const handleChangeRole = async (memberId: number, newRole: string) => {
    try {
      await api.team.updateRole(memberId, newRole);
      loadTeamMembers();
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Account"
          description="Manage your profile, security settings, and team"
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar name={profile.name} size="xl" />
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <p className="text-zinc-400">{profile.email}</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Profile Form */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    leftIcon={<User className="w-5 h-5" />}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    leftIcon={<Mail className="w-5 h-5" />}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    leftIcon={<Building2 className="w-5 h-5" />}
                    placeholder="Your company or organization"
                  />
                  <Select
                    label="Timezone"
                    options={timezones}
                    value={profile.timezone}
                    onChange={(value) => setProfile({ ...profile, timezone: value })}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={loading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Password Change */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  leftIcon={<Key className="w-5 h-5" />}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    hint="Minimum 8 characters"
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    error={passwords.confirm && passwords.new !== passwords.confirm ? 'Passwords do not match' : undefined}
                    required
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={loading}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-800 rounded-xl">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Add an extra layer of security to your account using a TOTP authenticator app.
                    </p>
                  </div>
                </div>
                <Badge variant={(user as any)?.totpEnabled ? 'success' : 'default'}>
                  {(user as any)?.totpEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="mt-6 flex gap-3">
                {(user as any)?.totpEnabled ? (
                  <>
                    <Button variant="outline" onClick={() => setShowRecoveryCodesModal(true)}>
                      View Recovery Codes
                    </Button>
                    <Button variant="danger" onClick={handleDisable2FA}>
                      Disable 2FA
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEnable2FA}>Enable 2FA</Button>
                )}
              </div>
            </Card>

            {/* Active Sessions */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                <Button variant="ghost" size="sm" onClick={handleRevokeAllSessions}>
                  Revoke All Others
                </Button>
              </div>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-zinc-700 rounded-lg">
                        <Monitor className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{session.device}</span>
                          {session.current && (
                            <Badge variant="success" size="sm">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                          <span>{session.browser}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.lastActive.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        icon={<LogOut className="w-4 h-4" />}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <Alert variant="warning" className="mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </Alert>
              <Button variant="danger">Delete Account</Button>
            </Card>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <Button onClick={() => setShowInviteModal(true)} icon={<UserPlus className="w-4 h-4" />}>
                  Invite Member
                </Button>
              </div>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar name={member.name} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{member.name}</span>
                          {member.status === 'pending' && (
                            <Badge variant="warning" size="sm">Pending</Badge>
                          )}
                        </div>
                        <span className="text-sm text-zinc-400">{member.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.role === 'owner' ? (
                        <Badge>Owner</Badge>
                      ) : (
                        <Select
                          options={roleOptions}
                          value={member.role}
                          onChange={(value) => handleChangeRole(member.id, value)}
                          className="w-32"
                        />
                      )}
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          icon={<Trash2 className="w-4 h-4 text-red-400" />}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Invite Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Team Member"
          description="Send an invitation to join your team"
        >
          <form onSubmit={handleInviteUser} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder="colleague@company.com"
              required
            />
            <Select
              label="Role"
              options={roleOptions}
              value={invite.role}
              onChange={(value) => setInvite({ ...invite, role: value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>

        {/* 2FA Setup Modal */}
        <Modal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          title="Setup Two-Factor Authentication"
          description="Scan the QR code with your authenticator app"
        >
          <div className="space-y-6">
            <div className="flex justify-center">
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 bg-white p-2 rounded-xl" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-2">Or enter this code manually:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-3 py-2 bg-zinc-800 rounded-lg font-mono text-sm">
                  {totpSecret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    toast.success('Copied to clipboard');
                  }}
                  icon={<Copy className="w-4 h-4" />}
                />
              </div>
            </div>
            <Divider />
            <Input
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShow2FAModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerify2FA}>Verify & Enable</Button>
            </div>
          </div>
        </Modal>

        {/* Recovery Codes Modal */}
        <Modal
          isOpen={showRecoveryCodesModal}
          onClose={() => setShowRecoveryCodesModal(false)}
          title="Recovery Codes"
          description="Save these codes in a safe place. You can use them to access your account if you lose your authenticator."
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Each code can only be used once. Generate new codes if you run out.
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <code
                  key={index}
                  className="px-3 py-2 bg-zinc-800 rounded-lg font-mono text-sm text-center"
                >
                  {code}
                </code>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  toast.success('Codes copied to clipboard');
                }}
                icon={<Copy className="w-4 h-4" />}
              >
                Copy All
              </Button>
              <Button onClick={() => setShowRecoveryCodesModal(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
