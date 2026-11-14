/** Runtime defaults and local security policy. */
export const SERVER_PORT = 3001;
export const CLIENT_PORT = 5173;
export const EXAMPLE_PROMPTS = [
  {
    category: 'train',
    label: 'Bengaluru to Goa train',
    summary: 'Specify date, departure time, and passenger count',
    text: 'Find a morning train from Bengaluru to Goa on 24 May for 2 passengers with a budget under ₹3,500.',
  },
  {
    category: 'shop',
    label: 'Wireless ANC headphones',
    summary: 'Compare live listings from a configured retailer',
    text: 'I want noise-canceling headphones with USB-C and lightweight build under ₹15,000.',
  },
  {
    category: 'info',
    label: 'Look up a current policy',
    summary: 'Open web search when no approved search API is connected',
    text: 'What is the luggage allowance and cancellation policy on express trains?',
  },
  {
    category: 'clarify',
    label: 'Incomplete travel request',
    summary: 'ActionDesk asks for the missing details',
    text: 'Book me a train to Goa.',
  },
];
