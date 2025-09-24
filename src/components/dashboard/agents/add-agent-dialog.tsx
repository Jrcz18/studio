
'use client';

import type { Agent } from '@/lib/types';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AddAgentDialog({
  children,
  open,
  onOpenChange,
  agent,
  onAddAgent,
  onUpdateAgent,
}: {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onAddAgent: (
    data: Omit<
      Agent,
      'id' | 'totalBookings' | 'totalCommissions' | 'status'
    >
  ) => void;
  onUpdateAgent: (agent: Agent) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionType, setCommissionType] =
    useState<Agent['commissionType']>('percentage');
  const [commissionRate, setCommissionRate] = useState(0);
  const [joinDate, setJoinDate] = useState('');

  useEffect(() => {
    if (open) {
      if (agent) {
        setName(agent.name);
        setEmail(agent.email);
        setPhone(agent.phone);
        setCommissionType(agent.commissionType || 'percentage');
        setCommissionRate(agent.commissionRate || 0);
        setJoinDate(agent.joinDate);
      } else {
        // Reset form for new agent
        setName('');
        setEmail('');
        setPhone('');
        setCommissionType('percentage');
        setCommissionRate(0);
        setJoinDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [open, agent]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const agentData = {
      name,
      email,
      phone,
      commissionType,
      commissionRate,
      joinDate,
    };

    if (agent) {
      onUpdateAgent({
        ...agent,
        ...agentData,
      });
    } else {
      onAddAgent(agentData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit' : 'Add New'} Agent</DialogTitle>
        </DialogHeader>
        <form id="agentForm" className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentName" className="text-right">
              Full Name
            </Label>
            <Input
              id="agentName"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentEmail" className="text-right">
              Email
            </Label>
            <Input
              id="agentEmail"
              type="email"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentPhone" className="text-right">
              Phone
            </Label>
            <Input
              id="agentPhone"
              type="tel"
              className="col-span-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="commissionType" className="text-right">
              Commission Type
            </Label>
            <Select
              value={commissionType}
              onValueChange={(v) =>
                setCommissionType(v as Agent['commissionType'])
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_commission">Fixed Commission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {commissionType === 'percentage' ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentCommission" className="text-right">
                Rate (%)
              </Label>
              <Input
                id="agentCommission"
                type="number"
                min="0"
                max="100"
                step="1"
                className="col-span-3"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                required
              />
            </div>
          ) : (
             <div className="col-span-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Fixed Commission:</strong> Agents will earn the surplus amount when they book a unit for a price higher than its base rate. No percentage rate is needed.
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentJoinDate" className="text-right">
              Join Date
            </Label>
            <Input
              id="agentJoinDate"
              type="date"
              className="col-span-3"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              {agent ? 'Save Changes' : 'Add Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
