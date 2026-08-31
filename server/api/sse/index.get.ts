export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) {
    throw createError({ statusCode: 403, message: 'No couple found' })
  }

  const coupleId = session.user.coupleId
  const eventStream = createEventStream(event)

  const unsubscribe = sseBusSubscribe(coupleId, (data) => {
    eventStream.push(data)
  })

  eventStream.onClosed(async () => {
    unsubscribe()
    await eventStream.close()
  })

  return eventStream.send()
})
