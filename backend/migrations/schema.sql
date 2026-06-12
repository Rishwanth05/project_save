--
-- PostgreSQL database dump
--

\restrict trTTQglYoamxFW8HOu6dS4cgyOWrrHgVsDKcEz3H8gUHh13wzuNLQyhoKZ56HfR

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_deletions; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.account_deletions (
    id integer NOT NULL,
    email character varying(255),
    reason text,
    deleted_at timestamp with time zone DEFAULT now(),
    comments text
);


ALTER TABLE public.account_deletions OWNER TO save_user;

--
-- Name: account_deletions_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.account_deletions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.account_deletions_id_seq OWNER TO save_user;

--
-- Name: account_deletions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.account_deletions_id_seq OWNED BY public.account_deletions.id;


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.admin_audit_log (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    admin_email text NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_audit_log OWNER TO save_user;

--
-- Name: admin_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.admin_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_audit_log_id_seq OWNER TO save_user;

--
-- Name: admin_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.admin_audit_log_id_seq OWNED BY public.admin_audit_log.id;


--
-- Name: hazard_categories; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.hazard_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hazard_categories OWNER TO save_user;

--
-- Name: hazard_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.hazard_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hazard_categories_id_seq OWNER TO save_user;

--
-- Name: hazard_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.hazard_categories_id_seq OWNED BY public.hazard_categories.id;


--
-- Name: notification_reads; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.notification_reads (
    user_id integer NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_reads OWNER TO save_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    severity character varying(20) DEFAULT 'medium'::character varying,
    type character varying(30) DEFAULT 'broadcast'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO save_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO save_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.otp_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    purpose character varying(20) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.otp_codes OWNER TO save_user;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.otp_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.otp_codes_id_seq OWNER TO save_user;

--
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- Name: password_history; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.password_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_history OWNER TO save_user;

--
-- Name: password_history_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.password_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_history_id_seq OWNER TO save_user;

--
-- Name: password_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.password_history_id_seq OWNED BY public.password_history.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_reset_tokens OWNER TO save_user;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.password_reset_tokens_id_seq OWNER TO save_user;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO save_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO save_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: report_status_history; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.report_status_history (
    id integer NOT NULL,
    report_id integer NOT NULL,
    new_status character varying(30) NOT NULL,
    previous_status character varying(30) NOT NULL,
    changed_by_user_id integer,
    user_role character varying(20) NOT NULL,
    note text,
    proof_image_url text,
    changed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.report_status_history OWNER TO save_user;

--
-- Name: report_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.report_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_status_history_id_seq OWNER TO save_user;

--
-- Name: report_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.report_status_history_id_seq OWNED BY public.report_status_history.id;


--
-- Name: report_statuses; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.report_statuses (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    label character varying(100),
    is_active boolean DEFAULT true
);


ALTER TABLE public.report_statuses OWNER TO save_user;

--
-- Name: report_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.report_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_statuses_id_seq OWNER TO save_user;

--
-- Name: report_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.report_statuses_id_seq OWNED BY public.report_statuses.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    user_id integer,
    title character varying(200),
    hazard_type character varying(50) NOT NULL,
    custom_description text,
    severity character varying(20) NOT NULL,
    description text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    location_method character varying(20) DEFAULT 'gps'::character varying,
    image_url text,
    status character varying(30) DEFAULT 'active'::character varying,
    confirmation_count integer DEFAULT 0,
    flag_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);


ALTER TABLE public.reports OWNER TO save_user;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reports_id_seq OWNER TO save_user;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: severity_levels; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.severity_levels (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(20),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true
);


ALTER TABLE public.severity_levels OWNER TO save_user;

--
-- Name: severity_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.severity_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.severity_levels_id_seq OWNER TO save_user;

--
-- Name: severity_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.severity_levels_id_seq OWNED BY public.severity_levels.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: save_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    role character varying(20) DEFAULT 'user'::character varying,
    trust_score smallint DEFAULT 50,
    is_verified boolean DEFAULT false,
    plan character varying(20) DEFAULT 'free'::character varying,
    fcm_token text,
    created_at timestamp with time zone DEFAULT now(),
    otp_attempts integer DEFAULT 0,
    otp_locked_until timestamp without time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    badge_tier character varying(20) DEFAULT 'Newcomer'::character varying,
    notes text,
    last_lat numeric(9,6),
    last_lng numeric(9,6)
);


ALTER TABLE public.users OWNER TO save_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: save_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO save_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: save_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: account_deletions id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.account_deletions ALTER COLUMN id SET DEFAULT nextval('public.account_deletions_id_seq'::regclass);


--
-- Name: admin_audit_log id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.admin_audit_log ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_log_id_seq'::regclass);


--
-- Name: hazard_categories id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.hazard_categories ALTER COLUMN id SET DEFAULT nextval('public.hazard_categories_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- Name: password_history id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.password_history ALTER COLUMN id SET DEFAULT nextval('public.password_history_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: report_status_history id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_status_history ALTER COLUMN id SET DEFAULT nextval('public.report_status_history_id_seq'::regclass);


--
-- Name: report_statuses id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_statuses ALTER COLUMN id SET DEFAULT nextval('public.report_statuses_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: severity_levels id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.severity_levels ALTER COLUMN id SET DEFAULT nextval('public.severity_levels_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: account_deletions account_deletions_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.account_deletions
    ADD CONSTRAINT account_deletions_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: hazard_categories hazard_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.hazard_categories
    ADD CONSTRAINT hazard_categories_name_key UNIQUE (name);


--
-- Name: hazard_categories hazard_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.hazard_categories
    ADD CONSTRAINT hazard_categories_pkey PRIMARY KEY (id);


--
-- Name: notification_reads notification_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_pkey PRIMARY KEY (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_email_purpose_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_email_purpose_key UNIQUE (email, purpose);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: report_status_history report_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_status_history
    ADD CONSTRAINT report_status_history_pkey PRIMARY KEY (id);


--
-- Name: report_statuses report_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_statuses
    ADD CONSTRAINT report_statuses_name_key UNIQUE (name);


--
-- Name: report_statuses report_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_statuses
    ADD CONSTRAINT report_statuses_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: severity_levels severity_levels_name_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.severity_levels
    ADD CONSTRAINT severity_levels_name_key UNIQUE (name);


--
-- Name: severity_levels severity_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.severity_levels
    ADD CONSTRAINT severity_levels_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_log_admin_id; Type: INDEX; Schema: public; Owner: save_user
--

CREATE INDEX idx_audit_log_admin_id ON public.admin_audit_log USING btree (admin_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: save_user
--

CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log USING btree (created_at DESC);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: save_user
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: save_user
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: notification_reads notification_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: report_status_history report_status_history_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_status_history
    ADD CONSTRAINT report_status_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: report_status_history report_status_history_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.report_status_history
    ADD CONSTRAINT report_status_history_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: save_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict trTTQglYoamxFW8HOu6dS4cgyOWrrHgVsDKcEz3H8gUHh13wzuNLQyhoKZ56HfR

