const uuid = require('uuid/v4')
const fs = require('fs')

const oldTickets = require('./input/tickets')
const oldComments = require('./input/comments')
const oldPContents = require('./input/oldPContents')
const newPContents = require('./input/newPContents')


const notFoundRefs = []
const notFoundContents = []
const newProjectId = newPContents[0].project_id

const getCGIFromPContentId = (id) => {
    let content = oldPContents.find(pContent => pContent.id === id)
    if (content) {
        if (content.options.cgi) {
            return content.options.cgi
        } else {
            return getCGIFromPContentId(content.parent_id)
        }
    }

    return null
}

const getPContentIdFromCGI = (cgi) => {
    let content = oldPContents.find(pContent => pContent.options.cgi === cgi)
    if (content) {
        return content.id
    }

    return null
}

let newTickets = oldTickets.map(ticket => {
    let newContentId = null
    let ref = getCGIFromPContentId(ticket.content_id)
    if (ref) {
        newContentId = getPContentIdFromCGI(ref)

        if (!newContentId) {
            notFoundContents.push(ref)
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

let newComments = oldComments.map(comment => {
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
    comment.id = uuid()
    comment.ticket_id = newTickets.find(ticket => ticket.options.old_ticket_id === comment.ticket_id).id

    return comment
})

/**
 * Write new tickets/comments
 */
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
