// src/app/api/contact/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendContactEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject and message are required' },
        { status: 400 },
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email:   email.toLowerCase(),
        phone:   phone || null,
        subject,
        message,
        status:  'NEW', // ← always uppercase
      },
    });

    try { await sendContactEmail({ name, email, phone, subject, message }); } catch {}

    return NextResponse.json(
      { message: 'Message sent successfully! We will get back to you soon.', id: contact.id },
      { status: 201 },
    );
  } catch (error) {
    console.error('Contact POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}