import {
  TaskType,
  TrainConstraints,
  ShoppingConstraints,
  GeneralInfoConstraints,
  TaskConstraints,
} from '../../../shared/types.js';
import {
  TrainConstraintsSchema,
  ShoppingConstraintsSchema,
  GeneralInfoConstraintsSchema,
} from '../../../shared/schemas.js';

export interface ParseResult {
  taskType: TaskType;
  constraints: TaskConstraints;
  needsClarification: boolean;
  missingFields?: string[];
  clarificationPrompt?: string;
  planTitles: string[];
}

export class TaskParser {
  parse(rawInput: string): ParseResult {
    const text = rawInput.trim();
    const lower = text.toLowerCase();

    // 1. Detect Task Type
    const isInfoQuery =
      lower.startsWith('what is') ||
      lower.startsWith('how does') ||
      lower.startsWith('tell me about') ||
      ((lower.startsWith('what ') || lower.startsWith('how ') || lower.startsWith('where ')) &&
        (lower.includes('policy') ||
          lower.includes('allowance') ||
          lower.includes('cancellation') ||
          lower.includes('guidelines') ||
          lower.includes('specs of')));

    const isTravelRequest =
      /\b(?:want|need|plan|trying|looking)\s+to\s+(?:go|travel|get|head|visit)\s+to\b/i.test(
        text,
      ) || /\b(?:travel|trip|journey)\s+to\b/i.test(text);

    const isTrainQuery =
      !isInfoQuery &&
      (lower.includes('train') ||
        lower.includes('rail') ||
        lower.includes('station') ||
        lower.includes('acela') ||
        lower.includes('ticket to') ||
        (lower.includes('from') && lower.includes('to') && !lower.includes('ship')) ||
        isTravelRequest);

    const isShopQuery =
      !isInfoQuery &&
      !isTrainQuery &&
      (lower.includes('shop') ||
        lower.includes('buy') ||
        lower.includes('compare') ||
        lower.includes('headphones') ||
        lower.includes('product') ||
        lower.includes('item') ||
        lower.includes('keyboard') ||
        lower.includes('monitor') ||
        lower.includes('phone') ||
        lower.includes('smartphone') ||
        lower.includes('mobile') ||
        lower.includes('earbud') ||
        lower.includes('laptop') ||
        lower.includes('tablet') ||
        lower.includes('gadget') ||
        lower.includes('order'));

    if (isTrainQuery) {
      return this.parseTrain(text);
    } else if (
      isShopQuery ||
      (!isInfoQuery &&
        (lower.includes('under $') || lower.includes('under ₹') || lower.includes('under rs')))
    ) {
      return this.parseShop(text);
    } else {
      return this.parseInfo(text);
    }
  }

  private parseTrain(text: string): ParseResult {
    const lower = text.toLowerCase();

    // Extract Origin & Destination
    let origin = '';
    let destination = '';

    // Regex: "from <Origin> to <Destination>"
    const fromToMatch = text.match(
      /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?=\s+(?:next|this|on|at|for|with|under|clarification)\b|[,!?\.]|$)/i,
    );
    if (fromToMatch) {
      origin = fromToMatch[1].trim();
      destination = fromToMatch[2].trim();
    } else {
      // Regex: "to <Destination>"
      const toMatch = text.match(
        /to\s+([a-zA-Z\s]+?)(?=\s+(?:next|this|on|at|for|with|under|clarification)\b|[,!?\.]|$)/i,
      );
      if (toMatch) {
        destination = toMatch[1].trim();
      }
      // Check for explicit origin field or common origin phrases
      const originFieldMatch = text.match(
        /(?:origin|from|departing from)\s*[:=]?\s*([a-zA-Z\s]+?)(?=\s+(?:to|next|this|on|at|for|with|under)\b|[,!?\.]|$)/i,
      );
      if (originFieldMatch && !originFieldMatch[1].toLowerCase().includes('me a train')) {
        origin = originFieldMatch[1].trim();
      } else if (lower.includes('bengaluru') || lower.includes('bangalore')) {
        origin = 'Bengaluru';
      } else if (lower.includes('new york') || lower.includes('nyc')) {
        origin = 'New York';
      } else if (lower.includes('from boston')) {
        origin = 'Boston';
      }
    }

    // Extract Date
    let date = '';
    if (lower.includes('next friday')) date = 'Next Friday';
    else if (lower.includes('this weekend')) date = 'This Weekend';
    else if (lower.includes('this saturday')) date = 'This Saturday';
    else if (lower.includes('tomorrow')) date = 'Tomorrow';
    else if (lower.includes('today')) date = 'Today';
    else if (lower.includes('monday')) date = 'Monday';
    else if (lower.includes('saturday')) date = 'Saturday';
    else if (lower.includes('sunday')) date = 'Sunday';
    else {
      const isoOrMonthMatch = text.match(
        /\b(\d{4}-\d{2}-\d{2}|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?))\b/i,
      );
      if (isoOrMonthMatch) {
        date = isoOrMonthMatch[0];
      }
    }

    // Extract Time Preference
    let timePreference: 'morning' | 'afternoon' | 'evening' | 'any' = 'any';
    if (lower.includes('morning') || lower.includes('am')) timePreference = 'morning';
    else if (lower.includes('afternoon') || lower.includes('midday')) timePreference = 'afternoon';
    else if (lower.includes('evening') || lower.includes('night') || lower.includes('pm'))
      timePreference = 'evening';

    // Extract Passenger Count
    let passengerCount = 1;
    const paxMatch = text.match(/(\d+)\s*(?:passengers?|people|tickets?|adults?|pax)/i);
    if (paxMatch) {
      passengerCount = parseInt(paxMatch[1], 10);
    } else if (lower.includes('for two') || lower.includes('2 passengers')) {
      passengerCount = 2;
    }

    // Extract Budget & Currency
    const isInr =
      /₹|\brs\.?\b|\binr\b|bengaluru|bangalore|goa|mumbai|delhi|chennai|hyderabad/i.test(text);
    const currency = isInr ? 'INR' : 'USD';
    let budget: number | undefined;
    const budgetMatch = text.match(
      /(?:under|budget|max|below|less than)\s*(?:₹|\$|rs\.?\s*|inr\s*)?([\d,]+)/i,
    );
    if (budgetMatch) {
      budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
    }

    // Detect preferred provider if mentioned
    let preferredProvider: string | undefined;
    if (lower.includes('irctc')) preferredProvider = 'irctc';
    else if (lower.includes('makemytrip') || lower.includes('mmt'))
      preferredProvider = 'makemytrip';
    else if (lower.includes('goibibo')) preferredProvider = 'goibibo';

    // Check for missing mandatory fields (origin & destination)
    const missing: string[] = [];
    if (!origin) missing.push('departure origin');
    if (!destination) missing.push('arrival destination');
    if (!date) missing.push('travel date');

    if (missing.length > 0) {
      return {
        taskType: 'train_search',
        constraints: {
          type: 'train_search',
          data: {
            origin: origin || 'Unknown',
            destination: destination || 'Unknown',
            date: date || 'Flexible',
            timePreference,
            passengerCount,
            budget,
            currency,
            preferredProvider,
          },
        },
        needsClarification: true,
        missingFields: missing,
        clarificationPrompt: `I can help search trains. Please share your ${missing.join(' and ')} (for example, departing from Bengaluru to Goa on 24 May). I won't assume a travel date.`,
        planTitles: [
          'Ask for missing route and date details',
          'Check train provider authorization and connection status',
          'Search authorized provider or offer official website handoff',
          'Review matching trains and wait for your selection',
          'Prepare supported checkout or hand off before payment',
        ],
      };
    }

    const validated: TrainConstraints = TrainConstraintsSchema.parse({
      origin,
      destination,
      date,
      timePreference,
      passengerCount,
      budget,
      currency,
      preferredProvider,
    });

    const symbol = currency === 'INR' ? '₹' : '$';
    const formattedBudget = budget
      ? `${symbol}${currency === 'INR' ? budget.toLocaleString('en-IN') : budget}`
      : 'flexible';

    return {
      taskType: 'train_search',
      constraints: { type: 'train_search', data: validated },
      needsClarification: false,
      planTitles: [
        `Understand route (${origin} to ${destination} on ${date}) and ${formattedBudget} budget`,
        'Check train provider integration and authorization status',
        'Search authorized provider or prepare official website handoff',
        'Review options and wait for your confirmation',
        'Complete supported checkout preparation and stop before payment',
      ],
    };
  }

  private parseShop(text: string): ParseResult {
    const lower = text.toLowerCase();

    // Detect preferred provider if mentioned
    let preferredProvider: string | undefined;
    if (lower.includes('amazon')) preferredProvider = 'amazon_in';
    else if (lower.includes('flipkart')) preferredProvider = 'flipkart';

    // Extract budget & currency
    const isInr = /₹|\brs\.?\b|\binr\b/i.test(text);
    const isUsd = /\$|\busd\b/i.test(text);
    const currency = isInr || !isUsd ? 'INR' : 'USD';
    let budget: number | undefined;
    const budgetMatch = text.match(
      /(?:under|budget|max|below|less than)\s*(?:₹|\$|rs\.?\s*|inr\s*)?([\d,]+)/i,
    );
    if (budgetMatch) {
      budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
    }

    // Extract constraints
    const constraints: string[] = [];
    if (
      lower.includes('noise-canceling') ||
      lower.includes('noise cancelling') ||
      lower.includes('anc')
    ) {
      constraints.push('noise-canceling');
    }
    if (lower.includes('usb-c') || lower.includes('type c')) {
      constraints.push('usb-c');
    }
    if (lower.includes('lightweight') || lower.includes('light')) {
      constraints.push('lightweight');
    }
    if (lower.includes('wireless') || lower.includes('bluetooth')) {
      constraints.push('wireless');
    }

    // Determine specific product query
    let query = '';
    if (lower.includes('headphones') || lower.includes('earbuds') || lower.includes('headset')) {
      query = 'headphones';
    } else if (
      lower.includes('smartphone') ||
      lower.includes('mobile phone') ||
      lower.includes('phone')
    ) {
      const namedPhone = text.match(
        /\b(?:iphone|pixel|galaxy|oneplus|redmi|poco|samsung|xiaomi)\b(?:\s+[a-z0-9-]+){0,3}/i,
      );
      query = namedPhone?.[0].trim() || 'smartphones';
    } else if (lower.includes('keyboard')) {
      query = 'keyboard';
    } else if (lower.includes('monitor')) {
      query = 'monitor';
    } else if (lower.includes('laptop')) {
      query = 'laptops';
    } else if (lower.includes('tablet')) {
      query = 'tablets';
    } else {
      const cleaned = text
        .replace(
          /\b(?:i want to|i want|help me|please|shop for|buy|order|purchase|compare|find|search|book me|book|reserve|get me|on amazon|on flipkart|something|a product|an item|a gift)\b/gi,
          '',
        )
        .replace(/(?:under|budget|max|below|less than)\s*(?:₹|\$|rs\.?\s*|inr\s*)?[\d,]+/gi, '')
        .replace(/[.,!?]/g, '')
        .trim();
      if (cleaned.length >= 3) {
        query = cleaned;
      }
    }

    if (!query) {
      const missing = ['product type or category'];
      if (!budget) missing.push('target budget');
      return {
        taskType: 'product_shopping',
        constraints: {
          type: 'product_shopping',
          data: {
            query: 'Unspecified Product',
            category: 'Electronics',
            budget,
            currency,
            constraints,
            preferredProvider,
          },
        },
        needsClarification: true,
        missingFields: missing,
        clarificationPrompt: `What product would you like to search for (for example, wireless noise-canceling headphones), and what is your budget?`,
        planTitles: [
          'Ask for product category, key features, and budget',
          'Check shopping provider authorization and connection status',
          'Search authorized provider or offer official website handoff',
          'Compare matching options and wait for your confirmation',
          'Complete supported checkout preparation and stop before payment',
        ],
      };
    }

    const validated: ShoppingConstraints = ShoppingConstraintsSchema.parse({
      query,
      category: 'Electronics',
      budget,
      currency,
      constraints,
      preferredProvider,
    });

    const symbol = currency === 'INR' ? '₹' : '$';
    const formattedBudget = budget
      ? `${symbol}${currency === 'INR' ? budget.toLocaleString('en-IN') : budget}`
      : 'flexible budget';

    return {
      taskType: 'product_shopping',
      constraints: { type: 'product_shopping', data: validated },
      needsClarification: false,
      planTitles: [
        `Understand product requirements ("${query}", ${formattedBudget})`,
        'Check shopping provider integration and authorization status',
        'Search authorized provider or prepare official website handoff',
        'Compare options and wait for your confirmation',
        'Complete supported checkout preparation and stop before payment',
      ],
    };
  }

  private parseInfo(text: string): ParseResult {
    const validated: GeneralInfoConstraints = GeneralInfoConstraintsSchema.parse({
      query: text,
    });

    return {
      taskType: 'general_info',
      constraints: { type: 'general_info', data: validated },
      needsClarification: false,
      planTitles: [
        'Check approved policy and reference sources',
        'Find matching passages and documented rules',
        'Attach source names and direct links to each answer',
        'Summarize findings and note any unverified details',
      ],
    };
  }
}
