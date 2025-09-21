
'use client';

import type { Investor, Unit } from '@/lib/types';
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
import { Checkbox } from '@/components/ui/checkbox';

export function AddInvestorDialog({
  children,
  open,
  onOpenChange,
  investor,
  onAddInvestor,
  onUpdateInvestor,
  units,
}: {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor?: Investor | null;
  onAddInvestor: (data: Omit<Investor, 'id' | 'status'>) => void;
  onUpdateInvestor: (investor: Investor) => void;
  units: Unit[];
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [sharePercentage, setSharePercentage] = useState(0);
  const [joinDate, setJoinDate] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (investor) {
        setName(investor.name);
        setEmail(investor.email);
        setPhone(investor.phone);
        setInvestmentAmount(investor.investmentAmount);
        setSharePercentage(investor.sharePercentage);
        setJoinDate(investor.joinDate);
        setSelectedUnitIds(investor.unitIds || []);
      } else {
        // Reset form for new investor
        setName('');
        setEmail('');
        setPhone('');
        setInvestmentAmount(0);
        setSharePercentage(0);
        setJoinDate(new Date().toISOString().split('T')[0]);
        setSelectedUnitIds([]);
      }
    }
  }, [open, investor]);

  const handleUnitSelection = (unitId: string, checked: boolean) => {
    if (checked) {
      setSelectedUnitIds((prev) => [...prev, unitId]);
    } else {
      setSelectedUnitIds((prev) => prev.filter((id) => id !== unitId));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const investorData = {
      name,
      email,
      phone,
      investmentAmount,
      sharePercentage,
      joinDate,
      unitIds: selectedUnitIds,
    };

    if (investor) {
      onUpdateInvestor({ ...investor, ...investorData });
    } else {
      onAddInvestor(investorData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{investor ? 'Edit' : 'Add New'} Investor</DialogTitle>
        </DialogHeader>
        <form
          id="investorForm"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorName" className="text-right">
              Full Name
            </Label>
            <Input
              id="investorName"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorEmail" className="text-right">
              Email
            </Label>
            <Input
              id="investorEmail"
              type="email"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorPhone" className="text-right">
              Phone
            </Label>
            <Input
              id="investorPhone"
              type="tel"
              className="col-span-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Units</Label>
            <div className="col-span-3 space-y-2">
              {units.map((unit) => (
                <div key={unit.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`unit-${unit.id}`}
                    checked={selectedUnitIds.includes(unit.id!)}
                    onCheckedChange={(checked) =>
                      handleUnitSelection(unit.id!, !!checked)
                    }
                  />
                  <Label htmlFor={`unit-${unit.id}`}>{unit.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorAmount" className="text-right">
              Investment (₱)
            </Label>
            <Input
              id="investorAmount"
              type="number"
              min="0"
              className="col-span-3"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(parseFloat(e.target.value))}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorShare" className="text-right">
              Share (%)
            </Label>
            <Input
              id="investorShare"
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="col-span-3"
              value={sharePercentage}
              onChange={(e) => setSharePercentage(parseFloat(e.target.value))}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="investorJoinDate" className="text-right">
              Join Date
            </Label>
            <Input
              id="investorJoinDate"
              type="date"
              className="col-span-3"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              {investor ? 'Save Changes' : 'Add Investor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
