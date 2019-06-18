const uuid = require('uuid/v4')
const fs = require('fs')

const oldTickets = require('./input/tickets')
const oldComments = require('./input/comments')
const oldPContents = require('./input/oldPContents')
const newPContents = require('./input/newPContents')


const notFoundRefs = []
const notFoundContents = []
const newProjectId = newPContents[0].project_id

const getCGIFromOldPContentId = (id) => {
    let content = oldPContents.find(pContent => pContent.id === id)
    if (content) {
        if (content.options.cgi) {
            return content.options.cgi
        } else {
            return getCGIFromOldPContentId(content.parent_id)
        }
    }

    return null
}

const getNewPContentIdFromCGI = (cgi) => {
    let content = newPContents.find(pContent => pContent.options.cgi === cgi)
    if (content) {
        return content.id
    }

    return null
}

const getNewTickets = (oldTickets) => {
    try {
        return oldTickets.map(ticket => {
            let newContentId = null
            let ref = getCGIFromOldPContentId(ticket.content_id)
            if (ref) {
                newContentId = getNewPContentIdFromCGI(ref)

                if (!newContentId) {
                    notFoundContents.push(ticket.content_id)
                }
            } else {
                notFoundRefs.push(ticket.content_id)
            }

            /**
             * Metadata on the script
             */
            ticket.options = {
                old_ticket_id: ticket.id,
                old_content_id: ticket.content_id
            }
            /**
             * Overrite this fields
             */
            ticket.project_id = newProjectId
            ticket.id = uuid()
            ticket.content_id = newContentId

            return ticket
        })
    } catch (err) {
        console.log(err)
        console.log("Error occured while generating new tickets")
    }
}

const getNewComments = (oldComments, newTickets) => {
    try {
        return oldComments.map(comment => {
            /**
             * Metadata on the script
             */
            comment.options = {
                old_comment_id: comment.id,
                old_ticket_id: comment.ticket_id
            }

            /**
             * Overrite this fields
             */
            comment.project_id = newProjectId
            comment.ticket_id = newTickets.find(ticket => {
                return ticket.options.old_ticket_id === comment.ticket_id
            }).id

            return comment
        })
    } catch (err) {
        console.log(err)
        console.log("Error occured while generating new comments")
    }
}

/**
 * Write new tickets/comments
 */
const generate = () => {
    const newTickets = getNewTickets(oldTickets)
    const newComments = getNewComments(oldComments, newTickets)

    fs.writeFile ('output/tickets.json', JSON.stringify(newTickets), (err) => {
            if (err) throw err
            console.log('Done writing tickets')
        }
    )

    fs.writeFile ('output/comments.json', JSON.stringify(newComments), (err) => {
            if (err) throw err
            console.log('Done writing comments')
        }
    )
}

module.exports = generate
