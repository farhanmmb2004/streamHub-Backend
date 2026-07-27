import neo4j from "neo4j-driver";

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

export const getSession = () => driver.session();

export const upsertSubscriptionEdge = async (subscriberId, channelId) => {
    const session = getSession();
    try {
        await session.run(
            `MERGE (s:User {id: $subscriberId})
             MERGE (c:User {id: $channelId})
             MERGE (s)-[:SUBSCRIBES_TO]->(c)`,
            { subscriberId: String(subscriberId), channelId: String(channelId) }
        );
    } finally {
        await session.close();
    }
};

export const removeSubscriptionEdge = async (subscriberId, channelId) => {
    const session = getSession();
    try {
        await session.run(
            `MATCH (s:User {id: $subscriberId})-[r:SUBSCRIBES_TO]->(c:User {id: $channelId})
             DELETE r`,
            { subscriberId: String(subscriberId), channelId: String(channelId) }
        );
    } finally {
        await session.close();
    }
};

export const getSubscriberIds = async (channelId) => {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (s:User)-[:SUBSCRIBES_TO]->(:User {id: $channelId})
             RETURN s.id AS id`,
            { channelId: String(channelId) }
        );
        return result.records.map((record) => record.get("id"));
    } finally {
        await session.close();
    }
};

export default driver;
