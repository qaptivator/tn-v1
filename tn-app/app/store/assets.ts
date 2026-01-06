import { defineStore } from 'pinia'

export type ParsedAssetPath = {
	namespace: string
	type: string
	category: string
	name: string
	purpose: string
}

type AssetCategory = 'entity' | 'ui'
type AssetType = 'texture' | 'model' | 'sound' | 'music' | 'atlas'
type AssetPurpose = 'world' | 'icon' //| 'ghost' | 'place' | 'damaged'
export type AssetPath =
	`tn:${AssetType}/${AssetCategory}/${string}/${AssetPurpose}`

type AssetMapped = {
	path: AssetPath
	url: string
}

export const useAssetsStore = defineStore('assets', {
	state: () => ({
		assets: [
			{
				path: 'tn:texture/ui/error',
				url: 'textures/colony/error.png',
			},
			{
				path: 'tn:texture/entity/factory/world',
				url: 'textures/colony/factory.png',
			},
			{
				path: 'tn:texture/entity/factory/icon',
				url: 'textures/colony/factory.png',
			},
			{
				path: 'tn:texture/entity/house/world',
				url: 'textures/colony/house.png',
			},
			{
				path: 'tn:texture/entity/house/icon',
				url: 'textures/colony/house.png',
			},
			{
				path: 'tn:texture/entity/quarry/world',
				url: 'textures/colony/quarry.png',
			},
			{
				path: 'tn:texture/entity/quarry/icon',
				url: 'textures/colony/quarry.png',
			},
		] as AssetMapped[],
	}),
	actions: {
		/**
		 * asset path format:
		 * {namespace}:{type}/{category}/{name}/{purpose}
		 *
		 * namespace → tn / modid / othergame
		 * type → texture / model / sound / music / atlas / etc
		 * category → entity / ui
		 * name → solar_plant / building_system
		 * purpose → world / icon / ghost / place / damaged
		 */
		parseAssetPath(assetPath: AssetPath): ParsedAssetPath {
			const [namespace, rest] = assetPath.split(':')
			if (!namespace)
				throw new Error(`Invalid asset path. Missing namespace (${assetPath})`)
			if (!rest)
				throw new Error(
					`Invalid asset path. Missing rest of the asset path (${assetPath})`
				)
			const [type, category, name, purpose] = rest.split('/')
			if (!type)
				throw new Error(`Invalid asset path. Missing type (${assetPath})`)
			return {
				namespace,
				type,
				category: category ?? '',
				name: name ?? '',
				purpose: purpose ?? '',
			}
		},
		getAssetUrl(assetPath?: AssetPath): {
			base: string // /texture/entity/factory/world
			rel: string // texture/entity/factory/world
			full: string // https://example.com/texture/entity/factory/world
		} {
			if (!assetPath) throw new Error(`Asset path is undefined (${assetPath})`)
			const asset = this.assets.find((a) => a.path === assetPath)
			if (!asset) throw new Error(`Asset not found (${assetPath})`)
			const normUrl = asset.url.endsWith('/')
				? asset.url.slice(0, -1)
				: asset.url
			return {
				base: '/' + normUrl,
				rel: normUrl,
				full: window.location.origin + '/' + normUrl,
			}
		},
		/*fetchAsset(assetPath: AssetPath, type: 'base' | 'full' = 'base') {
			//const parsed = this.parseAssetPath(assetPath)
			const asset = this.assets.find((a) => a.path === assetPath)
			if (!asset) throw new Error(`Asset not found (${assetPath})`)
			const loc = window.location.origin
			if (type === 'base') {
				return asset.url
				//return `${loc}/assets/${parsed.type}s/${parsed.category}/${parsed.name}/${parsed.purpose}.${parsed.type === 'texture' || parsed.type === 'atlas' ? 'png' : parsed.type === 'model' ? 'glb' : parsed.type === 'sound' || parsed.type === 'music' ? 'mp3' : 'dat'}`
			} else if (type === 'full') {
				return loc + asset.url
			}
		},*/
	},
})
