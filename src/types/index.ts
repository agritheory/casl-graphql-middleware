import { Ability } from '@casl/ability'
import { GraphQLResolveInfo } from 'graphql'

export type Context = {
	ability: Ability
	user?: {
		id: string
		roles?: string[]
	}
}

export type MiddlewareOptions = {
	subjectMap?: Record<string, string>
	actionMap?: Record<string, string>
	fieldPermissions?: Record<string, FieldPermission[]>
}

export type FieldPermission = {
	action: string
	subject: string
	field?: string
}

export type ResolverFn = (root: any, args: any, context: Context, info: GraphQLResolveInfo) => Promise<any> | any
