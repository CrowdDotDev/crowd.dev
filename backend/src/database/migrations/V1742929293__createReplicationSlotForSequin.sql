DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_replication_slots WHERE slot_name = 'sequin_slot'
    ) THEN
        PERFORM pg_create_logical_replication_slot('sequin_slot', 'pgoutput');
    END IF;
END$$;