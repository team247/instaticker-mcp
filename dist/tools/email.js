/** The sender select check of tech-spec D15: a non-empty identity of at most 320 characters. */
const checkIdentity = (body) => typeof body.identity === 'string' && body.identity.trim() !== '' && body.identity.length <= 320
    ? undefined
    : 'identity must be a non-empty string of at most 320 characters';
/** The Email Campaigns tools (tech-spec D13, D14): one tool per dashboard route, plus the contact-add tool (D10). */
export const EMAIL_TOOLS = [
    {
        name: 'email_get_overview',
        title: 'Get Email Campaigns overview',
        description: 'Read the Email Campaigns overview: connection, senders and recent campaigns.',
        method: 'GET',
        path: '/dashboard/email-campaigns/overview',
        hint: 'read',
    },
    {
        name: 'email_get_connection',
        title: 'Get AWS connection status',
        description: 'Read the AWS connection status. Connecting AWS is a dashboard step.',
        method: 'GET',
        path: '/dashboard/email-campaigns/connection',
        hint: 'read',
    },
    {
        name: 'email_list_senders',
        title: 'List Email senders',
        description: 'List the sender identities (domains and addresses).',
        method: 'GET',
        path: '/dashboard/email-campaigns/senders',
        hint: 'read',
    },
    {
        name: 'email_select_sender',
        check: checkIdentity,
        title: 'Select Email sender',
        description: 'Select an existing SES identity as a sender.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/select',
        body: {
            dto: 'the sender select route',
            properties: {
                identity: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 320,
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_create_sender',
        title: 'Create Email sender',
        description: 'Add a sender identity. The customer adds the DKIM records to their DNS.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders',
        body: {
            dto: 'CreateSenderIdentityDto',
            properties: {
                identity: {
                    type: 'string',
                },
                type: {
                    type: 'string',
                    enum: ['address', 'domain'],
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_get_sender_dkim',
        title: 'Get sender DKIM records',
        description: 'Read the DKIM DNS records of a sender identity.',
        method: 'GET',
        path: '/dashboard/email-campaigns/senders/{id}/dkim',
        hint: 'read',
    },
    {
        name: 'email_get_postal_prefill',
        title: 'Get postal address prefill',
        description: 'Read the suggested postal address for senders.',
        method: 'GET',
        path: '/dashboard/email-campaigns/senders/postal-prefill',
        hint: 'read',
    },
    {
        name: 'email_set_sender_postal',
        title: 'Set sender postal address',
        description: 'Set the postal address of a sender (CAN-SPAM footer).',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/{id}/postal',
        body: {
            dto: 'SenderPostalAddressDto',
            properties: {
                postalAddress: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_set_sender_default',
        title: 'Set sender default',
        description: 'Set the default display name and prefix of a domain sender.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/{id}/default',
        body: {
            dto: 'SenderDefaultDto',
            properties: {
                fromName: {
                    type: 'string',
                },
                fromPrefix: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_restart_sender',
        title: 'Restart sender verification',
        description: 'Restart the verification of a sender identity.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/{id}/restart',
        hint: 'write',
    },
    {
        name: 'email_change_sender_warmup',
        title: 'Change sender warm-up',
        description: 'Change the warm-up of a sender identity.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/{id}/warmup',
        body: {
            dto: 'SenderWarmupActionDto',
            properties: {
                action: {
                    type: 'string',
                    enum: ['stop', 'start'],
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_turn_off_sender_warmup',
        title: 'Turn off sender warm-up',
        description: 'Turn off the warm-up of a sender identity.',
        method: 'POST',
        path: '/dashboard/email-campaigns/senders/{id}/warmup/off',
        body: {
            dto: 'SenderWarmupOffDto',
            properties: {
                confirmWarm: {
                    type: 'boolean',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_get_sender',
        title: 'Get Email sender',
        description: 'Read one sender identity.',
        method: 'GET',
        path: '/dashboard/email-campaigns/senders/{id}',
        hint: 'read',
    },
    {
        name: 'email_list_seeds',
        title: 'List seed addresses',
        description: 'List the seed addresses that get a copy of each campaign.',
        method: 'GET',
        path: '/dashboard/email-campaigns/seeds',
        hint: 'read',
    },
    {
        name: 'email_add_seed',
        title: 'Add seed address',
        description: 'Add a seed address.',
        method: 'POST',
        path: '/dashboard/email-campaigns/seeds',
        body: {
            dto: 'AddSeedAddressDto',
            properties: {
                address: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_delete_seed',
        title: 'Delete seed address',
        description: 'Delete a seed address.',
        method: 'DELETE',
        path: '/dashboard/email-campaigns/seeds/{id}',
        hint: 'destructive',
    },
    {
        name: 'email_list_lists',
        title: 'List Email contact lists',
        description: 'List the Email contact lists.',
        method: 'GET',
        path: '/dashboard/email-campaigns/lists',
        hint: 'read',
    },
    {
        name: 'email_create_list',
        title: 'Create Email contact list',
        description: 'Create an Email contact list.',
        method: 'POST',
        path: '/dashboard/email-campaigns/lists',
        body: {
            dto: 'CreateEmailListDto',
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
        name: 'email_preview_list_deletion',
        title: 'Preview Email list deletion',
        description: 'Read what a list deletion affects.',
        method: 'GET',
        path: '/dashboard/email-campaigns/lists/{id}/deletion-preview',
        hint: 'read',
    },
    {
        name: 'email_delete_list',
        title: 'Delete Email contact list',
        description: 'Delete an Email contact list.',
        method: 'DELETE',
        path: '/dashboard/email-campaigns/lists/{id}',
        hint: 'destructive',
    },
    {
        name: 'email_list_contacts',
        title: 'List Email contacts',
        description: 'List the contacts of an Email contact list, with search, paging and sort.',
        method: 'GET',
        path: '/dashboard/email-campaigns/lists/{id}/contacts',
        query: ['search', 'page', 'pageSize', 'sort'],
        hint: 'read',
    },
    {
        name: 'email_add_contact',
        title: 'Add Email contact',
        description: 'Add one contact (email and fields) to an Email contact list.',
        method: 'POST',
        path: '/dashboard/email-campaigns/lists/{id}/contacts',
        body: {
            dto: 'UpsertContactDto',
            properties: {
                email: {
                    type: 'string',
                },
                fields: {
                    type: 'object',
                },
                expectedRev: {
                    type: 'number',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_update_contact',
        title: 'Update Email contact',
        description: 'Update one contact of an Email contact list.',
        method: 'PATCH',
        path: '/dashboard/email-campaigns/lists/{id}/contacts/{cid}',
        body: {
            dto: 'UpsertContactDto',
            properties: {
                email: {
                    type: 'string',
                },
                fields: {
                    type: 'object',
                },
                expectedRev: {
                    type: 'number',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_delete_contact',
        title: 'Delete Email contact',
        description: 'Delete one contact of an Email contact list.',
        method: 'DELETE',
        path: '/dashboard/email-campaigns/lists/{id}/contacts/{cid}',
        hint: 'destructive',
    },
    {
        name: 'email_list_imports',
        title: 'List Email imports',
        description: 'List the dashboard CSV imports of an Email contact list.',
        method: 'GET',
        path: '/dashboard/email-campaigns/lists/{id}/imports',
        hint: 'read',
    },
    {
        name: 'email_get_import',
        title: 'Get Email import',
        description: 'Read the status of one dashboard CSV import.',
        method: 'GET',
        path: '/dashboard/email-campaigns/imports/{id}',
        hint: 'read',
    },
    {
        name: 'email_list_templates',
        title: 'List Email templates',
        description: 'List the Email campaign templates.',
        method: 'GET',
        path: '/dashboard/email-campaigns/templates',
        hint: 'read',
    },
    {
        name: 'email_get_template',
        title: 'Get Email template',
        description: 'Read one Email campaign template.',
        method: 'GET',
        path: '/dashboard/email-campaigns/templates/{id}',
        hint: 'read',
    },
    {
        name: 'email_create_template',
        title: 'Create Email template',
        description: 'Create an Email campaign template.',
        method: 'POST',
        path: '/dashboard/email-campaigns/templates',
        body: {
            dto: 'CreateEmailTemplateDto',
            properties: {
                name: {
                    type: 'string',
                },
                subject: {
                    type: 'string',
                },
                designJson: {
                    type: 'string',
                },
                html: {
                    type: 'string',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_update_template',
        title: 'Update Email template',
        description: 'Update an Email campaign template.',
        method: 'PATCH',
        path: '/dashboard/email-campaigns/templates/{id}',
        body: {
            dto: 'UpdateEmailTemplateDto',
            properties: {
                name: {
                    type: 'string',
                },
                subject: {
                    type: 'string',
                },
                designJson: {
                    type: 'string',
                },
                html: {
                    type: 'string',
                },
            },
            required: false,
        },
        hint: 'write',
    },
    {
        name: 'email_delete_template',
        title: 'Delete Email template',
        description: 'Delete an Email campaign template.',
        method: 'DELETE',
        path: '/dashboard/email-campaigns/templates/{id}',
        hint: 'destructive',
    },
    {
        name: 'email_list_campaigns',
        title: 'List Email campaigns',
        description: 'List the Email campaigns (dashboard: Email Campaigns).',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns',
        hint: 'read',
    },
    {
        name: 'email_create_campaign',
        title: 'Create Email campaign',
        description: 'Create an Email campaign draft.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns',
        body: {
            dto: 'CreateEmailCampaignDto',
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
        name: 'email_update_campaign',
        title: 'Update Email campaign',
        description: 'Update an Email campaign draft: list, template, sender, subject.',
        method: 'PATCH',
        path: '/dashboard/email-campaigns/campaigns/{id}',
        body: {
            dto: 'UpdateEmailCampaignDto',
            properties: {
                name: {
                    type: 'string',
                },
                listId: {
                    type: 'string',
                },
                templateId: {
                    type: 'string',
                },
                fromIdentityId: {
                    type: 'string',
                },
                fromName: {
                    type: 'string',
                },
                fromPrefix: {
                    type: 'string',
                },
                subject: {
                    type: 'string',
                },
            },
            required: false,
        },
        hint: 'write',
    },
    {
        name: 'email_delete_campaign',
        title: 'Delete Email campaign',
        description: 'Delete an Email campaign draft.',
        method: 'DELETE',
        path: '/dashboard/email-campaigns/campaigns/{id}',
        hint: 'destructive',
    },
    {
        name: 'email_get_campaign',
        title: 'Get Email campaign',
        description: 'Read one Email campaign with its status and counts.',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns/{id}',
        hint: 'read',
    },
    {
        name: 'email_list_recipients',
        title: 'List Email campaign recipients',
        description: 'List the recipients of an Email campaign and their results.',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns/{id}/recipients',
        query: ['page', 'pageSize'],
        hint: 'read',
    },
    {
        name: 'email_send_test',
        title: 'Send Email test',
        description: 'Send a test of the draft. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/test',
        body: {
            dto: 'TestSendEmailDto',
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
        name: 'email_record_test_waiver',
        title: 'Record test waiver',
        description: 'Acknowledge a failed test for the current content, so the review has no test blocker.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/waiver',
        body: {
            dto: 'TestWaiverDto',
            properties: {
                acknowledged: {
                    type: 'boolean',
                },
            },
            required: true,
        },
        hint: 'write',
    },
    {
        name: 'email_get_preflight',
        title: 'Get preflight progress',
        description: 'Read the preflight progress of a draft.',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns/{id}/preflight',
        hint: 'read',
    },
    {
        name: 'email_get_draft',
        title: 'Get Email draft',
        description: 'Read the draft view of a campaign.',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns/{id}/draft',
        hint: 'read',
    },
    {
        name: 'email_run_preflight',
        title: 'Run preflight',
        description: 'Start the preflight of a draft: snapshot of the list and audience checks.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/preflight',
        hint: 'write',
    },
    {
        name: 'email_review_campaign',
        title: 'Review Email campaign',
        description: 'Read the review of a draft: audience, cost, blockers and the plan.',
        method: 'GET',
        path: '/dashboard/email-campaigns/campaigns/{id}/review',
        query: ['startAt'],
        hint: 'read',
    },
    {
        name: 'email_commit_campaign',
        title: 'Commit Email campaign',
        description: 'Start sending the campaign now. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/commit',
        body: {
            dto: 'CommitEmailCampaignDto',
            properties: {
                oversizedAcknowledged: {
                    type: 'boolean',
                },
                oversizedAckHash: {
                    type: 'string',
                },
                planAcknowledged: {
                    type: 'boolean',
                },
                planWindows: {
                    type: 'number',
                },
            },
            required: false,
        },
        hint: 'destructive',
    },
    {
        name: 'email_schedule_campaign',
        title: 'Schedule Email campaign',
        description: 'Schedule the campaign to send at a later time.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/schedule',
        body: {
            dto: 'ScheduleEmailCampaignDto',
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
        name: 'email_reschedule_campaign',
        title: 'Reschedule Email campaign',
        description: 'Move the send time of a scheduled campaign.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/reschedule',
        body: {
            dto: 'RescheduleCampaignDto',
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
        name: 'email_unschedule_campaign',
        title: 'Unschedule Email campaign',
        description: 'Return a scheduled campaign to draft.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/unschedule',
        hint: 'write',
    },
    {
        name: 'email_pause_campaign',
        title: 'Pause Email campaign',
        description: 'Pause a sending campaign.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/pause',
        hint: 'write',
    },
    {
        name: 'email_cancel_campaign',
        title: 'Cancel Email campaign',
        description: 'Cancel a sending or paused campaign. Emails already sent stay sent.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/cancel',
        hint: 'destructive',
    },
    {
        name: 'email_resume_campaign',
        title: 'Resume Email campaign',
        description: 'Resume a paused campaign. Spends credit and sends messages.',
        method: 'POST',
        path: '/dashboard/email-campaigns/campaigns/{id}/resume',
        hint: 'destructive',
    },
    {
        name: 'email_add_contacts',
        title: 'Add Email contacts',
        description: 'Add up to 100 contacts to an Email contact list, one after the other. Returns one outcome per contact: added, duplicate, rejected, rate_limited, unknown or not_attempted. A retry of the whole call is safe.',
        method: 'POST',
        path: '/dashboard/email-campaigns/lists/{id}/contacts',
        contacts: true,
        hint: 'write',
    },
];
