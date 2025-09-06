export interface IAuthToken {
    "Teamup-Token": string;
}
export interface ICalendarEventProp {
    id: string;
    series_id: string | null;
    remote_id: string | null;
    subcalendar_id: string;
    subcalendar_ids: string[];
    all_day: boolean;
    rrule: string;
    title: string;
    who: string;
    location: string;
    version: string;
    readonly: boolean;
    tz: string;
    attachments: string[];
    start_dt: string;
    end_dt: string;
    ristart_dt: string | null;
    rsstart_dt: string | null;
    creation_dt: string;
    update_dt: string | null;
    delete_dt: string | null;
    signup_enabled: boolean;
    comments_enabled: boolean;
    custom?: {
        campus_room_location?: string;
        virtual_classroom_link?: string;
    };
}
export interface IFileProp {
    calendar_config: {
        title: string;
        name: string;
        id: string;
    };
    events: ICalendarEventProp[];
}
