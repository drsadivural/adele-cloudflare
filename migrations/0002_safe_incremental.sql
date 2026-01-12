-- Safe Incremental Migration for ADELE
-- This migration uses CREATE TABLE IF NOT EXISTS to safely add new tables
-- without failing if tables already exist

-- Admin Configuration
CREATE TABLE IF NOT EXISTS `admin_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`is_encrypted` integer DEFAULT false,
	`updated_by` integer,
	`updated_at` integer,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

-- Agent Tasks
CREATE TABLE IF NOT EXISTS `agent_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`agent_type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`input` text,
	`output` text,
	`error_message` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`event_type` text NOT NULL,
	`event_data` text,
	`session_id` text,
	`user_agent` text,
	`ip_address` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- API Keys
CREATE TABLE IF NOT EXISTS `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`key_prefix` text NOT NULL,
	`scopes` text,
	`last_used_at` integer,
	`expires_at` integer,
	`revoked_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- App Templates
CREATE TABLE IF NOT EXISTS `app_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`icon` text,
	`tech_stack` text,
	`features` text,
	`preview_image` text,
	`base_prompt` text,
	`usage_count` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` integer
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`organization_id` integer,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- Cloud Accounts
CREATE TABLE IF NOT EXISTS `cloud_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`account_id` text,
	`region` text,
	`status` text DEFAULT 'pending',
	`credentials` text,
	`last_sync_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Cloud Resources
CREATE TABLE IF NOT EXISTS `cloud_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`name` text,
	`region` text,
	`status` text,
	`metadata` text,
	`last_sync_at` integer,
	`created_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `cloud_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Cloud Storage Access Logs
CREATE TABLE IF NOT EXISTS `cloud_storage_access_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`connection_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`path` text NOT NULL,
	`details` text,
	`ip_address` text,
	`created_at` integer,
	FOREIGN KEY (`connection_id`) REFERENCES `cloud_storage_connections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Cloud Storage Connections
CREATE TABLE IF NOT EXISTS `cloud_storage_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`bucket` text NOT NULL,
	`region` text,
	`credentials` text,
	`status` text DEFAULT 'pending',
	`last_sync_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Connector Definitions
CREATE TABLE IF NOT EXISTS `connector_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`icon` text,
	`config_schema` text,
	`auth_type` text NOT NULL,
	`scopes` text,
	`is_active` integer DEFAULT true,
	`created_at` integer
);

-- Connectors
CREATE TABLE IF NOT EXISTS `connectors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`definition_id` integer NOT NULL,
	`name` text NOT NULL,
	`config` text,
	`credentials` text,
	`status` text DEFAULT 'pending',
	`last_sync_at` integer,
	`error_message` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`definition_id`) REFERENCES `connector_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Data Exports
CREATE TABLE IF NOT EXISTS `data_exports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`file_url` text,
	`file_size` integer,
	`expires_at` integer,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS `data_retention_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` integer,
	`resource_type` text NOT NULL,
	`retention_days` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);

-- Deletion Requests
CREATE TABLE IF NOT EXISTS `deletion_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`scheduled_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Deployed Apps
CREATE TABLE IF NOT EXISTS `deployed_apps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`project_id` integer,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`region` text NOT NULL,
	`status` text DEFAULT 'pending',
	`url` text,
	`admin_url` text,
	`repository_url` text,
	`infrastructure_outputs` text,
	`config` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);

-- Deployments
CREATE TABLE IF NOT EXISTS `deployments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`app_id` integer NOT NULL,
	`version` text NOT NULL,
	`status` text DEFAULT 'pending',
	`build_logs` text,
	`deploy_logs` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`app_id`) REFERENCES `deployed_apps`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Email Connections
CREATE TABLE IF NOT EXISTS `email_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`credentials` text,
	`status` text DEFAULT 'pending',
	`last_sync_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Email Drafts
CREATE TABLE IF NOT EXISTS `email_drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`connection_id` integer NOT NULL,
	`to_addresses` text,
	`cc_addresses` text,
	`bcc_addresses` text,
	`subject` text,
	`body` text,
	`attachments` text,
	`scheduled_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `email_connections`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Emails
CREATE TABLE IF NOT EXISTS `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`connection_id` integer NOT NULL,
	`message_id` text NOT NULL,
	`thread_id` text,
	`from_address` text NOT NULL,
	`to_addresses` text,
	`cc_addresses` text,
	`subject` text,
	`body` text,
	`body_html` text,
	`attachments` text,
	`labels` text,
	`is_read` integer DEFAULT false,
	`is_starred` integer DEFAULT false,
	`received_at` integer,
	`created_at` integer,
	FOREIGN KEY (`connection_id`) REFERENCES `email_connections`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Generated Files
CREATE TABLE IF NOT EXISTS `generated_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`path` text NOT NULL,
	`content` text,
	`language` text,
	`version` integer DEFAULT 1,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Installed Integrations
CREATE TABLE IF NOT EXISTS `installed_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`integration_id` text NOT NULL,
	`config` text,
	`status` text DEFAULT 'active',
	`installed_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Onboarding Progress
CREATE TABLE IF NOT EXISTS `onboarding_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`current_step` integer DEFAULT 0,
	`completed_steps` text,
	`is_completed` integer DEFAULT false,
	`skipped` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Organizations
CREATE TABLE IF NOT EXISTS `organizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`owner_id` integer NOT NULL,
	`logo_url` text,
	`settings` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Payments
CREATE TABLE IF NOT EXISTS `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`subscription_id` integer,
	`stripe_payment_id` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd',
	`status` text NOT NULL,
	`invoice_url` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);

-- Project Versions
CREATE TABLE IF NOT EXISTS `project_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`version` integer NOT NULL,
	`name` text,
	`description` text,
	`snapshot` text,
	`created_by` integer,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- RAG Data Sources
CREATE TABLE IF NOT EXISTS `rag_data_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text,
	`status` text DEFAULT 'pending',
	`document_count` integer DEFAULT 0,
	`last_indexed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Rate Limit Records
CREATE TABLE IF NOT EXISTS `rate_limit_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`count` integer DEFAULT 0,
	`window_start` integer NOT NULL,
	`created_at` integer
);

-- Retention Settings
CREATE TABLE IF NOT EXISTS `retention_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`chat_retention_days` integer DEFAULT 90,
	`file_retention_days` integer DEFAULT 365,
	`log_retention_days` integer DEFAULT 30,
	`auto_delete_enabled` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Scheduled Work Runs
CREATE TABLE IF NOT EXISTS `scheduled_work_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scheduled_work_id` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`output` text,
	`error_message` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`scheduled_work_id`) REFERENCES `scheduled_works`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Scheduled Works
CREATE TABLE IF NOT EXISTS `scheduled_works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`schedule_type` text NOT NULL,
	`cron_expression` text,
	`interval_seconds` integer,
	`prompt` text NOT NULL,
	`project_id` integer,
	`is_active` integer DEFAULT true,
	`retry_count` integer DEFAULT 0,
	`max_retries` integer DEFAULT 3,
	`last_run_at` integer,
	`next_run_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);

-- Sessions
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`device_info` text,
	`ip_address` text,
	`last_active_at` integer,
	`expires_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Slack Integrations
CREATE TABLE IF NOT EXISTS `slack_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`team_id` text NOT NULL,
	`team_name` text,
	`access_token` text,
	`bot_user_id` text,
	`webhook_url` text,
	`channels` text,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`stripe_subscription_id` text,
	`stripe_customer_id` text,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS `team_invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token` text NOT NULL,
	`invited_by` integer NOT NULL,
	`expires_at` integer,
	`accepted_at` integer,
	`created_at` integer,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Team Members
CREATE TABLE IF NOT EXISTS `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer,
	`created_at` integer
);

-- Tool Connections
CREATE TABLE IF NOT EXISTS `tool_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`config` text,
	`credentials` text,
	`status` text DEFAULT 'pending',
	`last_used_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Usage Records
CREATE TABLE IF NOT EXISTS `usage_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`project_id` integer,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`unit` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);

-- User Biometrics
CREATE TABLE IF NOT EXISTS `user_biometrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`voice_id` text,
	`voice_settings` text,
	`avatar_settings` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- User Connectors
CREATE TABLE IF NOT EXISTS `user_connectors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`connector_type` text NOT NULL,
	`name` text NOT NULL,
	`config` text,
	`credentials` text,
	`status` text DEFAULT 'pending',
	`last_sync_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- User Sessions
CREATE TABLE IF NOT EXISTS `user_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`session_token` text NOT NULL,
	`device_name` text,
	`device_type` text,
	`browser` text,
	`os` text,
	`ip_address` text,
	`location` text,
	`is_current` integer DEFAULT false,
	`last_active_at` integer,
	`expires_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- User Settings
CREATE TABLE IF NOT EXISTS `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`theme` text DEFAULT 'dark',
	`language` text DEFAULT 'en',
	`timezone` text DEFAULT 'UTC',
	`notifications_email` integer DEFAULT true,
	`notifications_push` integer DEFAULT true,
	`notifications_sms` integer DEFAULT false,
	`default_model` text DEFAULT 'gpt-4',
	`default_provider` text DEFAULT 'openai',
	`voice_enabled` integer DEFAULT false,
	`voice_language` text DEFAULT 'en-US',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- User Uploads
CREATE TABLE IF NOT EXISTS `user_uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`project_id` integer,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`storage_key` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);

-- Voice Messages
CREATE TABLE IF NOT EXISTS `voice_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text,
	`audio_url` text,
	`duration` integer,
	`created_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `voice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Voice Sessions
CREATE TABLE IF NOT EXISTS `voice_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`project_id` integer,
	`status` text DEFAULT 'active',
	`voice_id` text,
	`language` text DEFAULT 'en-US',
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);

-- Voice Settings
CREATE TABLE IF NOT EXISTS `voice_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`voice_id` text DEFAULT 'alloy',
	`language` text DEFAULT 'en-US',
	`speed` real DEFAULT 1.0,
	`pitch` real DEFAULT 1.0,
	`wake_word_enabled` integer DEFAULT false,
	`wake_word` text DEFAULT 'hey adele',
	`proactive_mode` integer DEFAULT false,
	`push_to_talk` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS `webhook_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`webhook_id` integer NOT NULL,
	`event_type` text NOT NULL,
	`payload` text,
	`response_status` integer,
	`response_body` text,
	`attempts` integer DEFAULT 0,
	`delivered_at` integer,
	`created_at` integer,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Webhooks
CREATE TABLE IF NOT EXISTS `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text,
	`events` text,
	`is_active` integer DEFAULT true,
	`last_triggered_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Work Executions
CREATE TABLE IF NOT EXISTS `work_executions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`step_id` integer,
	`status` text DEFAULT 'pending',
	`output` text,
	`error_message` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `work_order_steps`(`id`) ON UPDATE no action ON DELETE set null
);

-- Work Order Activities
CREATE TABLE IF NOT EXISTS `work_order_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`user_id` integer,
	`type` text NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- Work Order Artifacts
CREATE TABLE IF NOT EXISTS `work_order_artifacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`storage_key` text,
	`size` integer,
	`created_at` integer,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Work Order Steps
CREATE TABLE IF NOT EXISTS `work_order_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_order_id` integer NOT NULL,
	`step_number` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending',
	`output` text,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Work Orders
CREATE TABLE IF NOT EXISTS `work_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`project_id` integer,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`priority` text DEFAULT 'medium',
	`status` text DEFAULT 'draft',
	`spec` text,
	`constraints` text,
	`acceptance_tests` text,
	`cost_estimate` integer,
	`actual_cost` integer,
	`assigned_to` integer,
	`approved_by` integer,
	`approved_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_audit_logs_user` ON `audit_logs` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_audit_logs_action` ON `audit_logs` (`action`);
CREATE INDEX IF NOT EXISTS `idx_usage_records_user` ON `usage_records` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_usage_records_type` ON `usage_records` (`type`);
CREATE INDEX IF NOT EXISTS `idx_work_orders_user` ON `work_orders` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_work_orders_status` ON `work_orders` (`status`);
CREATE INDEX IF NOT EXISTS `idx_scheduled_works_user` ON `scheduled_works` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_scheduled_works_next_run` ON `scheduled_works` (`next_run_at`);
CREATE INDEX IF NOT EXISTS `idx_emails_connection` ON `emails` (`connection_id`);
CREATE INDEX IF NOT EXISTS `idx_connectors_user` ON `connectors` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_cloud_accounts_user` ON `cloud_accounts` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_deployed_apps_user` ON `deployed_apps` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_voice_sessions_user` ON `voice_sessions` (`user_id`);
