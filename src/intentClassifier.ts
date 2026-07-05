// Need to train the data like this

import natural from "natural";

const classifier = new natural.BayesClassifier();

classifier.addDocument("Tell me about your pricing", "interest");
classifier.addDocument("How to integrate with HubSpot", "integration");
classifier.addDocument("Seems too expensive", "objection");
classifier.addDocument("cheap", "interest");
classifier.addDocument("not expensive", "interest");
classifier.addDocument("not cheap", "objection");
classifier.addDocument("Let's schedule a call", "follow_up");

classifier.train();

export function classifyIntent(text:string) {
  return classifier.classify(text);
}