import { postgraphile, makePluginHook } from 'postgraphile'
import http from 'http'
import { postgraphileCaslPlugin } from '../../src/helpers'

const pluginHook = makePluginHook([])

const middleware = postgraphile(
	process.env.DATABASE_URL || 'postgres://testuser:testpass@postgres:5432/testdb',
	'public',
	{
		watchPg: true,
		graphiql: true,
		enhanceGraphiql: true,
		dynamicJson: true,
		ignoreRBAC: false,
		ignoreIndexes: false,
		pluginHook,
		appendPlugins: [
			postgraphileCaslPlugin({
				subjectMap: {
					User: 'app_user',
					Item: 'item',
				},
			}),
		],
		enableCors: true,
		graphqlRoute: '/graphql',
		graphiqlRoute: '/graphiql',
	}
)

const server = http.createServer(middleware)

server.listen(5000, '0.0.0.0', () => {
	console.log('PostGraphile server listening on port 5000 - GraphiQL available at /graphiql')
})
