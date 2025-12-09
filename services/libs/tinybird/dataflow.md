```mermaid
flowchart TD
    %% CM Backend section
    subgraph CM[CM backend]
        connectors["Connectors<br/>(GitHub, Git, Nango, etc.)"]
        Postgres[(Postgres)]
        QuestDB[(QuestDB)]
        Kafka2[Kafka<br/>Receives normalised activity payloads]
        sequin[Sequin]
        
        %% CM internal connections
        connectors -->|Activity event data| Kafka2
        connectors -->|People and Org data| Postgres
        connectors -->|Activity relations data| Postgres
        Kafka2 -->|"QuestDB Kafka connector"| QuestDB
        Postgres -->|Real-time| sequin
        Kafka1[Kafka with Schema Registry for data contract]
        sequin -->|"Real-time"| Kafka1
    end
    
    %% Tinybird section
    subgraph Tinybird[Tinybird]
        DS["Datasource<br/>(ReplaceMergeTree)"]
        Pipe[Pipe]
        API[API<br/>with caching]
        
        DS --> Pipe --> API
    end
    
    %% Snowflake section
    subgraph Snowflake[Snowflake]
        Dedup[Deduplication]
        Bronze[Bronze]
        Silver[Silver]
        Gold[Gold / Platinum]
        
        Dedup --> Bronze --> Silver --> Gold
    end
    
    %% External connections
    Kafka1 -->|"People/Org data<br/>Activity relations<br/>Real-time"| DS
    Kafka2 -->|"Snowpipe streaming"| Dedup
    Kafka2 -->|"Kafka connector"| DS
    Postgres -->|"Fivetran sync"| Bronze
    Silver -->|"Snowflake/S3 connector"| DS
    Gold --> Other[Other products]
    
    %% Frontend flow
    API --> SSR[SSR Nuxt App]
    SSR --> CDN["CDN (Cloudflare)"]
    CDN --> Browser
