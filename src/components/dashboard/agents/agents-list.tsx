
'use client';

import type { Agent } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface AgentsListProps {
  agents: Agent[];
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
}

export function AgentsList({ agents, onEdit, onDelete }: AgentsListProps) {
  if (agents.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No agents found. Click "+ Add" to create one.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div key={agent.id} className="fb-card">
          <div className="fb-header">
            <div className="flex items-center">
              <div className="fb-avatar">
                <span>{agent.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{agent.name}</h3>
                <p className="text-sm text-gray-600">{agent.email}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                agent.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
            </span>
          </div>
          <div className="fb-content">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <p>
                  <strong>Commission:</strong>{' '}
                  {agent.commissionType === 'fixed_markup'
                    ? `₱${agent.commissionMarkup.toLocaleString()} per booking`
                    : `${agent.commissionRate}% of revenue`}
                </p>
                <p>
                  <strong>Total Bookings:</strong> {agent.totalBookings}
                </p>
              </div>
              <div>
                <p>
                  <strong>Total Commissions:</strong> ₱
                  {agent.totalCommissions.toLocaleString()}
                </p>
                <p>
                  <strong>Joined:</strong> {formatDate(agent.joinDate)}
                </p>
              </div>
            </div>
          </div>
          <div className="fb-actions">
            <button
              onClick={() => onEdit(agent)}
              className="fb-btn fb-btn-secondary"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(agent.id!)}
              className="fb-btn fb-btn-secondary"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
