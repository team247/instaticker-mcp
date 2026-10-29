/** The SMS Campaigns tools (tech-spec D13, D14): one tool per dashboard route, plus the contact-add tool (D10). */
export const SMS_TOOLS = [
    {
        name: 'sms_list_lists',
        title: 'List SMS contact lists',
        description: 'List the SMS contact lists (dashboard: SMS Campaigns > Lists).',
        method: 'GET',
        path: '/dashboard/sms-campaigns/lists',
        hint: 'read',
    },
    {
        name: 'sms_create_list',
        title: 'Create SMS contact list',
        description: 'Create an SMS contact list.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/lists',
        body: {
            dto: 'CreateListDto',
            properties: {
                name: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_delete_list',
        title: 'Delete SMS contact list',
        description: 'Delete an SMS contact list.',
        method: 'DELETE',
        path: '/dashboard/sms-campaigns/lists/{id}',
        hint: 'destructive',
    },
    {
        name: 'sms_list_contacts',
        title: 'List SMS contacts',
        description: 'List the contacts of an SMS contact list, with search and paging.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/lists/{id}/contacts',
        query: ['search', 'page', 'pageSize'],
        hint: 'read',
    },
    {
        name: 'sms_add_contact',
        title: 'Add SMS contact',
        description: 'Add one contact (phone and fields) to an SMS contact list.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/lists/{id}/contacts',
        body: {
            dto: 'AddContactDto',
            properties: {
                phone: {
                    type: 'string',
                },
                fields: {
                    type: 'object',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_update_contact',
        title: 'Update SMS contact',
        description: 'Update one SMS contact by its id.',
        method: 'PATCH',
        path: '/dashboard/sms-campaigns/contacts/{id}',
        body: {
            dto: 'UpdateContactDto',
            properties: {
                expectedVersion: {
                    type: 'number',
                },
                phone: {
                    type: 'string',
                },
                fields: {
                    type: 'object',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_get_render_context',
        title: 'Get SMS list render context',
        description: 'Read the fields and a sample contact that a message of this list can use.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/lists/{id}/render-context',
        hint: 'read',
    },
    {
        name: 'sms_get_import',
        title: 'Get SMS import',
        description: 'Read the status of one dashboard CSV import.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/imports/{id}',
        hint: 'read',
    },
    {
        name: 'sms_list_imports',
        title: 'List SMS imports',
        description: 'List the dashboard CSV imports of an SMS contact list.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/lists/{id}/imports',
        hint: 'read',
    },
    {
        name: 'sms_list_templates',
        title: 'List SMS templates',
        description: 'List the SMS message templates.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/templates',
        hint: 'read',
    },
    {
        name: 'sms_create_template',
        title: 'Create SMS template',
        description: 'Create an SMS message template.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/templates',
        body: {
            dto: 'CreateTemplateDto',
            properties: {
                name: {
                    type: 'string',
                },
                body: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_update_template',
        title: 'Update SMS template',
        description: 'Update an SMS message template.',
        method: 'PATCH',
        path: '/dashboard/sms-campaigns/templates/{id}',
        body: {
            dto: 'UpdateTemplateDto',
            properties: {
                name: {
                    type: 'string',
                },
                body: {
                    type: 'string',
                },
            },
            required: false,
        },
        hint: 'write',
    },
    {
        name: 'sms_delete_template',
        title: 'Delete SMS template',
        description: 'Delete an SMS message template.',
        method: 'DELETE',
        path: '/dashboard/sms-campaigns/templates/{id}',
        hint: 'destructive',
    },
    {
        name: 'sms_list_campaigns',
        title: 'List SMS campaigns',
        description: 'List the SMS campaigns (dashboard: SMS Campaigns).',
        method: 'GET',
        path: '/dashboard/sms-campaigns/campaigns',
        hint: 'read',
    },
    {
        name: 'sms_create_campaign',
        title: 'Create SMS campaign',
        description: 'Create an SMS campaign draft.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns',
        body: {
            dto: 'CreateCampaignDto',
            properties: {
                name: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_update_campaign',
        title: 'Update SMS campaign',
        description: 'Update an SMS campaign draft: name, list, message.',
        method: 'PATCH',
        path: '/dashboard/sms-campaigns/campaigns/{id}',
        body: {
            dto: 'UpdateCampaignDto',
            properties: {
                name: {
                    type: 'string',
                },
                listId: {
                    type: 'string',
                },
                message: {
                    type: 'string',
                },
            },
            required: false,
        },
        hint: 'write',
    },
    {
        name: 'sms_delete_campaign',
        title: 'Delete SMS campaign',
        description: 'Delete an SMS campaign draft.',
        method: 'DELETE',
        path: '/dashboard/sms-campaigns/campaigns/{id}',
        hint: 'destructive',
    },
    {
        name: 'sms_get_campaign',
        title: 'Get SMS campaign',
        description: 'Read one SMS campaign with its status and counts.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/campaigns/{id}',
        hint: 'read',
    },
    {
        name: 'sms_list_recipients',
        title: 'List SMS campaign recipients',
        description: 'List the recipients of an SMS campaign and their send results.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/campaigns/{id}/recipients',
        query: ['page', 'pageSize', 'status', 'phone', 'sortBy', 'sortOrder'],
        hint: 'read',
    },
    {
        name: 'sms_render_campaign',
        title: 'Render SMS campaign',
        description: 'Render the campaign message for a sample contact.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/campaigns/{id}/render',
        hint: 'read',
    },
    {
        name: 'sms_review_campaign',
        title: 'Review SMS campaign',
        description: 'Read the review of a draft: audience, cost, blockers and the reviewToken for commit.',
        method: 'GET',
        path: '/dashboard/sms-campaigns/campaigns/{id}/review',
        hint: 'read',
    },
    {
        name: 'sms_send_test',
        title: 'Send SMS test',
        description: 'Send a test of the draft message. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/test',
        body: {
            dto: 'TestSendDto',
            properties: {
                to: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'destructive',
    },
    {
        name: 'sms_commit_campaign',
        title: 'Commit SMS campaign',
        description: 'Start sending the campaign now. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/commit',
        body: {
            dto: 'CommitCampaignDto',
            properties: {
                reviewToken: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'destructive',
    },
    {
        name: 'sms_schedule_campaign',
        title: 'Schedule SMS campaign',
        description: 'Schedule the campaign to send at a later time.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/schedule',
        body: {
            dto: 'ScheduleCampaignDto',
            properties: {
                scheduledAt: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'destructive',
    },
    {
        name: 'sms_reschedule_campaign',
        title: 'Reschedule SMS campaign',
        description: 'Move the send time of a scheduled campaign.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/reschedule',
        body: {
            dto: 'RescheduleSmsCampaignDto',
            properties: {
                scheduledAt: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'sms_unschedule_campaign',
        title: 'Unschedule SMS campaign',
        description: 'Return a scheduled campaign to draft.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/unschedule',
        hint: 'write',
    },
    {
        name: 'sms_cancel_campaign',
        title: 'Cancel SMS campaign',
        description: 'Cancel a sending or paused campaign. Messages already sent stay sent.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/cancel',
        hint: 'destructive',
    },
    {
        name: 'sms_pause_campaign',
        title: 'Pause SMS campaign',
        description: 'Pause a sending campaign.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/pause',
        hint: 'write',
    },
    {
        name: 'sms_resume_campaign',
        title: 'Resume SMS campaign',
        description: 'Resume a paused campaign. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/campaigns/{id}/resume',
        hint: 'destructive',
    },
    {
        name: 'sms_add_contacts',
        title: 'Add SMS contacts',
        description: 'Add up to 100 contacts to an SMS contact list, one after the other. Returns one outcome per contact: added, duplicate, rejected, rate_limited, unknown or not_attempted. A retry of the whole call is safe.',
        method: 'POST',
        path: '/dashboard/sms-campaigns/lists/{id}/contacts',
        contacts: true,
        hint: 'write',
    },
];
