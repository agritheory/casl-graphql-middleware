import { AbilityBuilder, Ability, subject } from '@casl/ability'
import { Context } from '../types'

export const createAbility = (user?: Context['user']) => {
	const { can, cannot, build } = new AbilityBuilder(Ability)

	if (!user) {
		// Public abilities
		can('read', 'Query')
		can('read', 'PublicType')
	} else {
		// Authenticated user abilities
		can('read', 'Query')
		can('read', 'Mutation')

		if (user.roles?.includes('admin')) {
			// Admin abilities
			can('manage', 'all')
		} else {
			// Regular user abilities
			can('read', 'User', { id: user.id })
			can('update', 'User', { id: user.id })
			cannot('update', 'User', ['role', 'permissions'])
		}
	}

	return build()
}
