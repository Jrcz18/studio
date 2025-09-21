
'use server';

import type { Booking, Unit } from "@/lib/types";

export async function sendDiscordNotification(booking: Booking, unit: Unit) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_URL environment variable not set on the server. Skipping notification.");
        return;
    }

    const checkin = new Date(booking.checkinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const checkout = new Date(booking.checkoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });


    const embed = {
        title: `🎉 New Booking for ${unit.name}!`,
        color: 0xFFD700, // Gold color
        fields: [
            { name: "Guest", value: `${booking.guestFirstName} ${booking.guestLastName}`, inline: true },
            { name: "Unit", value: unit.name, inline: true },
            { name: "Dates", value: `${checkin} to ${checkout}`, inline: false },
            { name: "Total Amount", value: `₱${booking.totalAmount.toLocaleString()}`, inline: true },
            { name: "Payment Status", value: booking.paymentStatus, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: "Manila Prime Staycation"
        }
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds: [embed] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Discord notification failed: ${response.statusText}`, errorBody);
        } else {
            console.log('Discord notification sent successfully.');
        }
    } catch (error) {
        console.error("Error sending Discord notification:", error);
    }
}
