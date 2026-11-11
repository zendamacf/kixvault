export const sneakerConditions = ['deadstock', 'lightly_worn', 'worn', 'beat'] as const;
export type SneakerCondition = (typeof sneakerConditions)[number];

export const departureTypes = ['sold', 'donated', 'gifted', 'traded', 'lost', 'other'] as const;
export type DepartureType = (typeof departureTypes)[number];
