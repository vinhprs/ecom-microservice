#!/bin/bash
set -e

POSTGRES_DB=${POSTGRES_DB:-categories_db}
REPLICATION_USER=${REPLICATION_USER:-replicator}
REPLICATION_PASSWORD=${REPLICATION_PASSWORD:-replicator_password}

# Create replication user
psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    -- Create replication user
    CREATE USER $REPLICATION_USER WITH REPLICATION ENCRYPTED PASSWORD '$REPLICATION_PASSWORD';
    GRANT pg_read_all_data TO $REPLICATION_USER;

    SELECT pg_create_physical_replication_slot('replication_slot1');
    SELECT pg_create_physical_replication_slot('replication_slot2');
    
    GRANT CONNECT ON DATABASE $POSTGRES_DB TO $REPLICATION_USER;
EOSQL


# Configure pg_hba.conf to allow replication connections
echo "host replication replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
echo "host all replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"

# Reload configuration
psql -U postgres -c "SELECT pg_reload_conf();"