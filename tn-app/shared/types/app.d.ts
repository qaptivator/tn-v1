/*import type { AppPlugin } from '../../app/plugins/app'
import type {
	ApolloClient,
	OperationVariables,
	ObservableQuery,
} from '@apollo/client/core'

type ModifiedApollo = Omit<ApolloClient, 'query' | 'mutate'> & {
	query: <
		TData = any,
		TVariables extends OperationVariables = OperationVariables
	>(
		options: ApolloClient.QueryOptions<TData, TVariables>
	) => Promise<ObservableQuery.Result<TData>>

	mutate: <TData = any, TVariables = OperationVariables>(
		options: QueryOptions<TData, TVariables>
	) => Promise<QueryResult<TData>>
}

declare module '#app' {
	interface NuxtApp {
		$app: AppPlugin
		$apollo: ModifiedApollo
	}
}*/

/*declare module 'Phaser' {
	interface Game {
		data: any
	}
}*/
