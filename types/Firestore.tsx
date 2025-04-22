export interface User {
    user_id: string; // Firebase UID
    email: string;
    name?: string;
    created_at: string; // ISO timestamp
  }
  
  export interface Subscription {
    subscription_id: string;
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired';
    start_date: string; 
    end_date: string; // ISO timestamp
    plan: string; // Default: "single plan"
    last_payment_date: string; // ISO timestamp
  }
  
  export interface Payment {
    payment_id: string;
    user_id: string;
    stripe_charge_id: string;
    amount: number;
    currency: string; // e.g., "USD"
    status: 'succeeded' | 'failed' | 'pending';
    payment_method: string; // e.g., card, PayPal
    created_at: string; // ISO timestamp
  }
  
  export interface Chat {
    chat_id: string;
    user_id: string;
    created_at: string; // ISO timestamp
    expires_at: string; // ISO timestamp (Auto-delete after 30 days)
  }
  
  export interface Message {
    message_id: string;
    chat_id: string;
    sender: 'user' | 'CarTechAI';
    message: string;
    timestamp: string; // ISO timestamp
  }

  export interface CommunityPost {
    post_id: string;
    user_id: string; // User who created the post
    title: string;
    description: string;
    status: 'open' | 'closed'; // User can close the post when resolved
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
    tags?: string[]; // Optional, to categorize questions
}

export interface CommunityResponse {
    response_id: string;
    post_id: string; // The post this response belongs to
    user_id: string; // User who responded
    message: string;
    created_at: string; // ISO timestamp
    is_accepted: boolean; // True if the question poster accepted this response
}

export interface CommunityLike {
    like_id: string;
    user_id: string;
    post_id: string; // OR response_id (likes can be for posts or responses)
    type: 'post' | 'response'; // Defines if it's liking a post or response
    created_at: string;
}
