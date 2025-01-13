-- Create a function to notify the channel
CREATE OR REPLACE 
    FUNCTION notify_change()
        RETURNS TRIGGER AS $$
    BEGIN
        PERFORM pg_notify('data_change', row_to_json(NEW)::text);
        RETURN NEW;
    END;
    $$
    LANGUAGE plpgsql;

-- Create a trigger on your table
CREATE 
    TRIGGER data_change_trigger
        AFTER INSERT OR UPDATE ON "RequestLogs"
        FOR EACH ROW
            EXECUTE PROCEDURE notify_change();
