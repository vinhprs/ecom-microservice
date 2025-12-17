#!/bin/bash
set -e

# Create replication user
psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    -- Create replication user
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_password';
    GRANT pg_read_all_data TO replicator;

    SELECT pg_create_physical_replication_slot('replication_slot1');
    SELECT pg_create_physical_replication_slot('replication_slot2');
    
    GRANT CONNECT ON DATABASE product_db TO replicator;
EOSQL


# Configure pg_hba.conf to allow replication connections
echo "host replication replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
echo "host all replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"