import "server-only";
import type { Db } from "mongodb";

// These rules provide a second validation boundary beneath the HTTP handlers.
// Access itself is enforced by server-only credentials and the application DAL.
export async function applyDatabasePolicies(db: Db) {
  const policies = {
    users: {
      bsonType: "object",
      required: [
        "email",
        "name",
        "passwordHash",
        "role",
        "disabled",
        "createdAt",
      ],
      properties: {
        email: { bsonType: "string", maxLength: 254 },
        name: { bsonType: "string", minLength: 2, maxLength: 100 },
        passwordHash: { bsonType: "string" },
        role: { enum: ["participant", "admin", "judge"] },
        disabled: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
      },
    },
    teams: {
      bsonType: "object",
      required: [
        "registrationId",
        "leaderId",
        "name",
        "nameKey",
        "members",
        "payment",
        "submission",
        "createdAt",
      ],
      properties: {
        registrationId: { bsonType: "string" },
        leaderId: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 2, maxLength: 80 },
        nameKey: { bsonType: "string" },
        // Required by new registration validation; absent on existing teams.
        institution: { bsonType: "string", minLength: 2, maxLength: 160 },
        registrationStatus: {
          enum: ["new", "contacted", "awaiting_confirmation", "confirmed"],
        },
        internalNotes: { bsonType: "string", maxLength: 4000 },
        whatsappConsent: { bsonType: "bool" },
        whatsappConsentAt: { bsonType: "date" },
        registrationKey: { bsonType: "string" },
        members: {
          bsonType: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            bsonType: "object",
            required: ["name", "email"],
            properties: {
              name: { bsonType: "string", minLength: 2, maxLength: 100 },
              email: { bsonType: "string", maxLength: 254 },
            },
          },
        },
        payment: {
          bsonType: "object",
          required: ["status", "amount"],
          properties: {
            status: { enum: ["pending", "confirmed", "rejected"] },
            amount: { enum: [1500] },
            reference: { bsonType: "string", minLength: 3, maxLength: 100 },
            referenceKey: { bsonType: "string" },
            methodId: { bsonType: "string" },
          },
        },
        submission: { bsonType: "object" },
        createdAt: { bsonType: "date" },
      },
    },
    files: {
      bsonType: "object",
      required: ["purpose", "name", "type", "data", "size", "createdAt"],
      properties: {
        purpose: { enum: ["receipt", "deck", "logo"] },
        type: { enum: ["image/png", "image/jpeg", "application/pdf"] },
        data: { bsonType: "binData" },
        size: { bsonType: ["int", "double"], minimum: 1, maximum: 3000000 },
        createdAt: { bsonType: "date" },
      },
    },
    scores: {
      bsonType: "object",
      required: ["teamId", "judgeId", "scores", "feedback", "updatedAt"],
      properties: {
        teamId: { bsonType: "objectId" },
        judgeId: { bsonType: "objectId" },
        scores: {
          bsonType: "array",
          minItems: 6,
          maxItems: 6,
          items: { bsonType: ["int", "double"], minimum: 0, maximum: 30 },
        },
        feedback: { bsonType: "string", maxLength: 3000 },
        updatedAt: { bsonType: "date" },
      },
    },
    audit: {
      bsonType: "object",
      required: ["actorId", "action", "createdAt"],
      properties: {
        actorId: { bsonType: "objectId" },
        action: { bsonType: "string" },
        createdAt: { bsonType: "date" },
      },
    },
  };
  // Score/file/audit collections may not yet exist. Creating them is idempotent.
  for (const [name, schema] of Object.entries(policies)) {
    try {
      await db.createCollection(name);
    } catch (error) {
      if ((error as { code?: number }).code !== 48) throw error;
    }
    await db.command({
      collMod: name,
      validator: { $jsonSchema: schema },
      validationLevel: "strict",
      validationAction: "error",
    });
  }
}
