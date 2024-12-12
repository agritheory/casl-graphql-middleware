import { subject } from '@casl/ability'
import { GraphQLError } from 'graphql'
import { parse, visit } from 'graphql/language'
import { Context, MiddlewareOptions, ResolverFn } from '../types'

// Helper to extract operation name from GraphQL info
const getOperationName = (info: GraphQLResolveInfo): string => {
	return info.operation.operation.toLowerCase()
}

// Helper to get full field path
const getFieldPath = (info: GraphQLResolveInfo): string => {
	return info.path.typename ? `${info.path.typename}.${info.path.key}` : String(info.path.key)
}

// Parse GraphQL query to extract accessed fields
const extractAccessedFields = (query: string): string[] => {
	const ast = parse(query)
	const fields: string[] = []

	visit(ast, {
		Field: {
			enter(node) {
				if (node.name.value !== '__typename') {
					fields.push(node.name.value)
				}
			},
		},
	})

	return fields
}

// CASL GraphQL middleware factory
export const createCaslMiddleware = (options: MiddlewareOptions = {}) => {
	const {
		subjectMap = {},
		actionMap = {
			query: 'read',
			mutation: 'update',
			subscription: 'read',
		},
		fieldPermissions = {},
	} = options

	return async (resolve: ResolverFn, root: any, args: any, context: Context, info: GraphQLResolveInfo) => {
		if (!context.ability) {
			throw new GraphQLError('CASL Ability not found in context')
		}

		const operation = getOperationName(info)
		const fieldPath = getFieldPath(info)
		const action = actionMap[operation] || operation

		// Get subject from map or default to type name
		const subjectType = info.parentType.name
		const subjectName = subjectMap[subjectType] || subjectType

		// Check field-level permissions if defined
		if (fieldPermissions[fieldPath]) {
			const permissions = fieldPermissions[fieldPath]
			const allowed = permissions.some(permission =>
				context.ability.can(permission.action, subject(permission.subject, args))
			)

			if (!allowed) {
				throw new GraphQLError(`Access denied for field ${fieldPath}`)
			}
		}

		// Check operation-level permission
		const allowed = context.ability.can(action, subject(subjectName, args))
		if (!allowed) {
			throw new GraphQLError(`Access denied for ${action} on ${subjectName}`)
		}

		// If mutation, check field-specific permissions
		if (operation === 'mutation' && args.input) {
			const accessedFields = extractAccessedFields(info.operation.loc?.source.body || '')

			for (const field of accessedFields) {
				const fieldAllowed = context.ability.can('update', subject(subjectName, { field }))
				if (!fieldAllowed) {
					throw new GraphQLError(`Access denied for updating field ${field} on ${subjectName}`)
				}
			}
		}

		return resolve(root, args, context, info)
	}
}
