<template>
	<div class="space-y-2">
		<!-- Null/Undefined -->
		<div
			v-if="value === null || value === undefined"
			class="text-gray-400 italic"
		>
			{{ value === null ? 'null' : 'undefined' }}
		</div>

		<!-- Primitives -->
		<div
			v-else-if="typeof value === 'string'"
			class="space-y-1"
		>
			<label class="text-xs text-gray-400">string</label>
			<input
				:value="value"
				@input="$emit('update', $event.target.value)"
				type="text"
				class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
			/>
		</div>

		<div
			v-else-if="typeof value === 'number'"
			class="space-y-1"
		>
			<label class="text-xs text-gray-400">number</label>
			<input
				:value="value"
				@input="$emit('update', parseFloat($event.target.value) || 0)"
				type="number"
				class="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
			/>
		</div>

		<div
			v-else-if="typeof value === 'boolean'"
			class="space-y-1"
		>
			<label class="text-xs text-gray-400">boolean</label>
			<UCheckbox
				:model-value="value"
				@update:model-value="$emit('update', $event)"
			/>
		</div>

		<!-- Arrays -->
		<div
			v-else-if="Array.isArray(value)"
			class="space-y-2"
		>
			<div class="text-xs text-gray-400 font-mono">
				Array[{{ value.length }}]
			</div>
			<div class="space-y-2 ml-2 border-l border-gray-700 pl-2">
				<div
					v-for="(item, idx) in value"
					:key="idx"
					class="bg-gray-900 rounded p-2"
				>
					<div class="text-xs text-gray-400 mb-1">[{{ idx }}]</div>
					<ComponentEditor
						:value="item"
						:component-name="`[${idx}]`"
						@update="updateArrayItem(idx, $event)"
					/>
				</div>
			</div>
			<UButton
				size="xs"
				severity="secondary"
				@click="addArrayItem"
				class="mt-2"
			>
				+ Add
			</UButton>
		</div>

		<!-- Objects -->
		<div
			v-else-if="typeof value === 'object'"
			class="space-y-2"
		>
			<div
				v-if="Object.keys(value).length === 0"
				class="text-gray-400 italic text-sm"
			>
				empty object
			</div>
			<div
				v-else
				class="space-y-2 ml-2 border-l border-gray-700 pl-2"
			>
				<div
					v-for="(fieldValue, fieldName) in value"
					:key="fieldName"
					class="bg-gray-900 rounded p-2"
				>
					<div class="flex items-center justify-between mb-1">
						<span class="text-xs font-mono text-gray-300">{{ fieldName }}</span>
						<button
							v-if="typeof fieldValue === 'object'"
							@click="toggleNested(String(fieldName))"
							class="text-xs text-gray-500 hover:text-gray-400"
						>
							{{ expandedFields.has(String(fieldName)) ? '▼' : '▶' }}
						</button>
					</div>
					<div
						v-show="
							typeof fieldValue !== 'object' ||
							expandedFields.has(String(fieldName))
						"
					>
						<ComponentEditor
							:value="fieldValue"
							:component-name="fieldName"
							@update="updateObjectField(String(fieldName), $event)"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Fallback -->
		<div
			v-else
			class="text-gray-400 text-sm"
		>
			{{ typeof value }}
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	value: any
	componentName: string
}>()

const emit = defineEmits<{
	update: [value: any]
}>()

const expandedFields = ref(new Set<string>())

const toggleNested = (fieldName: string) => {
	if (expandedFields.value.has(fieldName)) {
		expandedFields.value.delete(fieldName)
	} else {
		expandedFields.value.add(fieldName)
	}
}

const updateObjectField = (fieldName: string, newValue: any) => {
	const updated = { ...props.value, [fieldName]: newValue }
	emit('update', updated)
}

const updateArrayItem = (index: number, newValue: any) => {
	const updated = [...props.value]
	updated[index] = newValue
	emit('update', updated)
}

const addArrayItem = () => {
	const updated = [...props.value, null]
	emit('update', updated)
}
</script>
