// es.ts — Elasticsearch client singleton
import { Client } from "@elastic/elasticsearch";

const es = new Client({ node: process.env.ES_URL ?? "http://localhost:9200" });
export default es;
