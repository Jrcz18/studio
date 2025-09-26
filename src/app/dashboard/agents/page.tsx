
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentsList } from '@/components/dashboard/agents/agents-list';
import { AddAgentDialog } from '@/components/dashboard/agents/add-agent-dialog';
import type { Agent } from '@/lib/types';
import { getAgents, addAgent as addAgentService, updateAgent as updateAgentService, deleteAgent as deleteAgentService } from '@/services/agents';
import { useUIContext } from '@/hooks/use-ui-context';


export default function AgentsPage() {
  const { isAddAgentOpen, setIsAddAgentOpen } = useUIContext();
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAgents = async () => {
      const agentsData = await getAgents();
      setAgents(agentsData);
      setLoading(false);
    }
    fetchAgents();
  }, []);
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddAgentOpen(true);
    }
  }, [searchParams, setIsAddAgentOpen]);

  const handleOpenAddDialog = () => {
    setSelectedAgent(null);
    setIsAddAgentOpen(true);
  };
  
  const handleOpenEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsAddAgentOpen(true);
  };

  const addAgent = async (newAgentData: Omit<Agent, 'id' | 'totalBookings' | 'totalCommissions' | 'status'>) => {
    const newAgent: Omit<Agent, 'id'> = {
      ...newAgentData,
      totalBookings: 0,
      totalCommissions: 0,
      status: 'active',
    };
    const { id } = await addAgentService(newAgent);
    setAgents((prev) => [...prev, { ...newAgent, id }]);
  };

  const updateAgent = async (updatedAgent: Agent) => {
    await updateAgentService(updatedAgent);
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
    setSelectedAgent(null);
  }

  const deleteAgent = async (agentId: string) => {
    if (confirm('Are you sure you want to remove this agent?')) {
        await deleteAgentService(agentId);
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading agents...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agent Management</h2>
          <p className="text-sm text-gray-500">Partner agents & commissions</p>
        </div>
        <AddAgentDialog
          open={isAddAgentOpen}
          onOpenChange={setIsAddAgentOpen}
          onAddAgent={addAgent}
          onUpdateAgent={updateAgent}
          agent={selectedAgent}
        >
          <button
            onClick={handleOpenAddDialog}
            className="prime-button px-4 py-2 text-sm"
          >
            + Add
          </button>
        </AddAgentDialog>
      </div>
      <AgentsList agents={agents} onEdit={handleOpenEditDialog} onDelete={deleteAgent} />
    </div>
  );
}
