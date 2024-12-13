export const makeCombinedUserId = ({userId, identityId}: {userId: string; identityId: string}) => {
    return `${identityId}:${userId}`;
};
