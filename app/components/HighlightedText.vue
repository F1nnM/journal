<script setup lang="ts">
const props = defineProps<{
  text: string
}>()

interface Segment {
  text: string
  highlighted: boolean
}

const segments = computed<Segment[]>(() => {
  const parts: Segment[] = []
  const raw = props.text
  const openTag = '<<HL>>'
  const closeTag = '<</HL>>'

  let cursor = 0

  while (cursor < raw.length) {
    const hlStart = raw.indexOf(openTag, cursor)

    if (hlStart === -1) {
      parts.push({ text: raw.slice(cursor), highlighted: false })
      break
    }

    if (hlStart > cursor) {
      parts.push({ text: raw.slice(cursor, hlStart), highlighted: false })
    }

    const contentStart = hlStart + openTag.length
    const hlEnd = raw.indexOf(closeTag, contentStart)

    if (hlEnd === -1) {
      // No closing tag found, treat rest as plain text
      parts.push({ text: raw.slice(contentStart), highlighted: true })
      break
    }

    parts.push({ text: raw.slice(contentStart, hlEnd), highlighted: true })
    cursor = hlEnd + closeTag.length
  }

  return parts
})
</script>

<template>
  <span>
    <template v-for="(segment, idx) in segments" :key="idx">
      <mark
        v-if="segment.highlighted"
        class="rounded px-0.5 bg-amber-200 dark:bg-amber-800/50"
      >{{ segment.text }}</mark>
      <span v-else>{{ segment.text }}</span>
    </template>
  </span>
</template>
