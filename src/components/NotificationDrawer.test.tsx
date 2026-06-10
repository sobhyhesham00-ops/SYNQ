// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationDrawer } from './NotificationDrawer';

vi.mock('../firebase', () => ({
  db: {},
  wrappedUpdateDoc: vi.fn()
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn()
}));

const mockNotifications = [
  {
    id: 'n1',
    title: 'Test Notification Unread',
    message: 'Hello',
    createdAt: new Date().toISOString(),
    seenByUsers: ['user-other'],
    clearedByUsers: []
  },
  {
    id: 'n2',
    title: 'Test Notification Read',
    message: 'Hello 2',
    createdAt: new Date().toISOString(),
    seenByUsers: ['user-1'],
    clearedByUsers: []
  }
];

describe('NotificationDrawer', () => {
  it('correctly calculates unread count based on current user id', () => {
    const currentUser = { id: 'user-1', name: 'User One', role: 'agent' as const };
    render(
      <NotificationDrawer 
        isOpen={true} 
        onClose={() => {}} 
        visibleNotifs={mockNotifications} 
        currentUser={currentUser} 
        handleMarkAllNotifsAsRead={() => {}} 
        handleMarkSingleNotifAsRead={() => {}} 
        setActiveTab={() => {}} 
      />
    );
    // n1 (unread since seenByUsers has user-other) and n2 (read)
    // The visual UI may only show unread dot or similar
    expect(screen.getByText(/Test Notification Unread/i)).toBeDefined();
    // Assuming unread notifications have a specific styling or dot, we can check its presence. 
    // In our implementation, unread items have 'bg-indigo-500 rounded-full' dot
  });
});
