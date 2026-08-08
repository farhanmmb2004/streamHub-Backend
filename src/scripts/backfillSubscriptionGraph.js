import connect from "../Db/index.js";
import { Subscription } from "../models/subscription.model.js";
import driver, { getSession } from "../utils/neo4jClient.js";

const BATCH_SIZE = 1000;

const backfill = async () => {
    await connect();

    const subscriptions = await Subscription.find({}).select("subscriber channel").lean();
    console.log(`found ${subscriptions.length} subscriptions in MongoDB`);

    const session = getSession();
    try {
        for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
            const batch = subscriptions.slice(i, i + BATCH_SIZE).map((sub) => ({
                subscriberId: sub.subscriber.toString(),
                channelId: sub.channel.toString()
            }));

            await session.run(
                `UNWIND $pairs AS pair
                 MERGE (s:User {id: pair.subscriberId})
                 MERGE (c:User {id: pair.channelId})
                 MERGE (s)-[:SUBSCRIBES_TO]->(c)`,
                { pairs: batch }
            );
            console.log(`synced ${Math.min(i + BATCH_SIZE, subscriptions.length)}/${subscriptions.length}`);
        }
    } finally {
        await session.close();
    }

    console.log("backfill complete");
};

backfill()
    .catch((error) => {
        console.error("backfill failed", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await driver.close();
        process.exit();
    });
