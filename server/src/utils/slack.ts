import { WebClient } from '@slack/web-api';
import { env } from '../config/env';

let slackClient: WebClient | null = null;
let isSlackConfigured = false;

if (env.SLACK_BOT_TOKEN) {
  slackClient = new WebClient(env.SLACK_BOT_TOKEN);
  isSlackConfigured = true;
  console.log('✅ Slack client configured');
} else {
  console.log('⚠️  Slack not configured: SLACK_BOT_TOKEN missing');
}

/**
 * Send a message to a Slack channel
 */
export const sendSlackMessage = async (
  channel: string,
  text: string,
  blocks?: any[]
): Promise<boolean> => {
  try {
    if (!isSlackConfigured || !slackClient) {
      console.log('⚠️  Slack not configured, skipping message');
      return false;
    }

    const result = await slackClient.chat.postMessage({
      channel,
      text,
      blocks,
    });

    console.log('✅ Slack message sent:', result.ts);
    return true;
  } catch (error) {
    console.error('❌ Error sending Slack message:', error);
    return false;
  }
};

/**
 * Send a formatted notification for new employee
 */
export const sendNewEmployeeNotification = async (
  employeeName: string,
  employeeEmail: string,
  role: string,
  department: string,
  hrName: string
): Promise<boolean> => {
  const channel = env.SLACK_CHANNEL || '#general';
  
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🎉 New Employee Joined!',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name:*\n${employeeName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${employeeEmail}`,
        },
        {
          type: 'mrkdwn',
          text: `*Role:*\n${role}`,
        },
        {
          type: 'mrkdwn',
          text: `*Department:*\n${department}`,
        },
        {
          type: 'mrkdwn',
          text: `*Added by:*\n${hrName}`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

  return sendSlackMessage(
    channel,
    `🎉 New Employee Joined: ${employeeName} (${role})`,
    blocks
  );
};

/**
 * Send a notification for trial expiration
 */
export const sendTrialExpirationNotification = async (
  organizationName: string,
  daysRemaining: number
): Promise<boolean> => {
  const channel = env.SLACK_CHANNEL || '#general';
  
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⏰ Trial Expiration Notice',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Organization:*\n${organizationName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Days Remaining:*\n${daysRemaining}`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

  return sendSlackMessage(
    channel,
    `⏰ Trial Expiration Notice: ${organizationName} has ${daysRemaining} days remaining`,
    blocks
  );
};

export { isSlackConfigured };
