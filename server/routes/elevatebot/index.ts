import express, { Router } from 'express';
import { handleSupportQuery, supportValidators, getSupportTickets, resolveTicket } from './supportHandler';

const router = Router();

// Support query endpoints
router.post('/support', supportValidators, handleSupportQuery);
router.get('/support/tickets', getSupportTickets);
router.post('/support/tickets/:ticketId/resolve', resolveTicket);

export default router;