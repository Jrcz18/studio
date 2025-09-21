
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getReceiptSettings, updateReceiptSettings } from '@/services/receipt-settings';
import type { ReceiptSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptSettingsPage() {
    const [settings, setSettings] = useState<Partial<ReceiptSettings>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const settingsData = await getReceiptSettings();
            setSettings(settingsData);
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            await updateReceiptSettings(settings);
            toast({
                title: "Settings Saved",
                description: "Your receipt settings have been updated successfully.",
            });
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading settings...</div>;
    }

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                <Link href="/dashboard/more" className="mr-4 p-2 rounded-full hover:bg-gray-100">
                   <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Receipt Settings</h2>
                    <p className="text-sm text-gray-500">Customize details shown on the booking receipt.</p>
                </div>
            </div>

            <div className="prime-card p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">WiFi Details</h3>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="wifiNetwork">WiFi Network Name (SSID)</Label>
                            <Input
                                id="wifiNetwork"
                                name="wifiNetwork"
                                value={settings.wifiNetwork || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., Manila Prime WiFi"
                            />
                        </div>
                        <div>
                            <Label htmlFor="wifiPassword">WiFi Password</Label>
                            <Input
                                id="wifiPassword"
                                name="wifiPassword"
                                value={settings.wifiPassword || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., PrimeStay123"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Check-in / Check-out</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="checkinTime">Check-in Time</Label>
                            <Input
                                id="checkinTime"
                                name="checkinTime"
                                type="time"
                                value={settings.checkinTime || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <Label htmlFor="checkoutTime">Check-out Time</Label>
                            <Input
                                id="checkoutTime"
                                name="checkoutTime"
                                type="time"
                                value={settings.checkoutTime || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                name="contactEmail"
                                type="email"
                                value={settings.contactEmail || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., support@manilaprime.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                name="contactPhone"
                                type="tel"
                                value={settings.contactPhone || ''}
                                onChange={handleInputChange}
                                placeholder="e.g., +63 917 123 4567"
                            />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="prime-button">
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
