export const sneakerConditions = ['deadstock', 'lightly_worn', 'worn', 'beat'] as const;
export type SneakerCondition = (typeof sneakerConditions)[number];
