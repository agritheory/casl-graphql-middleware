import { makeExtendSchemaPlugin, gql } from 'postgraphile'
import { Context, MiddlewareOptions } from './types'
import { createAbility } from './middleware/ability'
import { createCaslMiddleware } from './middleware/middleware'

export const postgraphileCaslPlugin = (options: MiddlewareOptions = {}) => {
	return makeExtendSchemaPlugin(build => ({
		typeDefs: gql`
			input CreateAbilityInput {
				userId: String!
				roles: [String!]
			}

			type AbilityResponse {
				success: Boolean!
				ability: JSON
				message: String
			}

			type SecretData {
				id: String!
				content: String!
			}

			extend type Query {
				getSecretData: SecretData
			}

			extend type Mutation {
				createAbility(input: CreateAbilityInput!): AbilityResponse!
			}
		`,
		resolvers: {
			Query: {
				getSecretData: async (_query, args, context, resolveInfo) => {
					// This should be protected by CASL
					if (!context.ability?.can('read', 'SecretData')) {
						throw new Error('Access denied')
					}

					return {
						id: '123',
						content: 'This is protected content',
					}
				},
			},
			Mutation: {
				createAbility: async (_query, args, context, resolveInfo) => {
					try {
						const { userId, roles } = args.input
						const ability = createAbility({ id: userId, roles })
						context.ability = ability

						return {
							success: true,
							ability: ability.rules,
							message: 'Ability created successfully',
						}
					} catch (error) {
						console.error('Error creating ability:', error)
						return {
							success: false,
							ability: null,
							message: error instanceof Error ? error.message : 'Unknown error occurred',
						}
					}
				},
			},
		},
	}))
}
