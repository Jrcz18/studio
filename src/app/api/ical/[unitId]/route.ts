
import {NextResponse} from 'next/server';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import type {Booking} from '@/lib/types';

export const dynamic = 'force-dynamic';

// This function tells Next.js that this route has no static paths to generate,
// effectively excluding it from static builds while keeping it for server-side rendering.
export async function generateStaticParams() {
  return [];
}

export async function GET(
  request: Request,
  {params}: {params: {unitId: string}}
) {
  const {unitId} = params;

  if (!unitId) {
    return new NextResponse('Unit ID is required', {status: 400});
  }

  try {
    const bookingsCollection = collection(db, 'bookings');
    const q = query(bookingsCollection, where('unitId', '==', unitId));
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as Booking)
    );

    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ManilaPrimeStaycation//PropertyManagementSystem//EN',
    ];

    bookings.forEach(booking => {
      const startDate = new Date(booking.checkinDate)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0];
      const endDate = new Date(booking.checkoutDate)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0];
      const createdAt = (booking.createdAt ? new Date(booking.createdAt) : new Date())
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0];
        
      // Use the original iCal UID if available, otherwise create one.
      const bookingId = booking.uid || `${booking.id}@manilaprimestaycation.com`;

      icalContent.push('BEGIN:VEVENT');
      icalContent.push(`UID:${bookingId}`);
      icalContent.push(`DTSTAMP:${createdAt}Z`);
      icalContent.push(`DTSTART;VALUE=DATE:${startDate.substring(0, 8)}`);
      icalContent.push(`DTEND;VALUE=DATE:${endDate.substring(0, 8)}`);
      icalContent.push(
        `SUMMARY:Reserved - ${booking.guestFirstName} ${booking.guestLastName}`
      );
      icalContent.push(
        `DESCRIPTION:Booking for ${booking.guestFirstName} ${booking.guestLastName}`
      );
      icalContent.push('END:VEVENT');
    });

    icalContent.push('END:VCALENDAR');

    return new NextResponse(icalContent.join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="unit-${unitId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new NextResponse('Internal Server Error', {status: 500});
  }
}
