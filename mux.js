import ShimToPolyfill from "shim-to-polyfill"
const AbortError= ShimToPolyfill( "AbortError", import("abort-controller"))

export function AsyncIterMux( opt){
	Object.defineProperties( this, {
		data: {
			value: new WeakMap()
		},
		pending: {
			value: []
		},
		stream: {
			value: []
		}
	})
	return this
}
export {
	AsyncIterMux as default,
	AsyncIterMux as mux,
	AsyncIterMux as Mux,
}
AsyncIterMux.prototype= Object.create( null, {
	add: {
		value: function add( stream){
			// build context for this stream
			const
				pos= this.stream.length,
				datum= {}
			// store this context
			this.data.set( stream, datum)
			// save this stream
			this.stream.push( stream)

			// this is the heart of the strategy: handlers that enrich iteration
			// with additional context we can process with

			function resolve( iteration){
				return {
					pos: resolve.pos,
					iteration,
					stream,
					resolve,
					reject
				}
			}
			resolve.pos= pos
			function reject( err){
				return {
					pos: reject.pos,
					err,
					stream
				}
			}
			reject.pos= pos
	
			// run first resolve/reject
			const next= stream.next.then( resolve, reject)
			// store in pending
			this.pending.push( next)
			return this
		}
	},

	// next
	_raceResolve: {
		value: function _raceResolve({
			pos,
			iteration,
			stream,
			resolve,
			reject
		 }){
			// check for done
			if( this.done){
				const value= this.doneValue
				delete this.doneValue
				return {
					done: true,
					value
				}
			}

			// check pos. streams can be deleted, which would change pos.
			if( this.stream[ pos]!== stream){
				// update position, locally & in continuation
				pos= resolve.pos= reject.pos= this.stream.indexOf( stream)
			}

			if( iteration.done){
				// TODO
				return
			}

			// get next value
			const next= stream.next( resolve, reject)
			this.pending[ pos]= next
			
			return iteration
		}
	},
	_raceReject: {
		value: function _raceReject( value){
			
		}
	},
	next: {
		value: function next( passedIn){
			return Promise
				.race( this.pending)
				.then( this._raceResolve, this,_raceReject)
		}
	},

	// more
	return( returnValue){
	},
	throw( throwEx){
	},
	abort( abortEx){
	},
	[ Symbol.asyncIterator]: {
			value: function(){
				return this
			}
	}
})
