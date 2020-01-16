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
		value: function _raceResolve( ctx){
			// check mux for done
			if( this.done){
				const value= this.doneValue
				delete this.doneValue
				return {
					done: true,
					value
				}
			}

			// check this stream for done
			if( ctx.iteration.done){
				// stream can now be removed & muxing continues
				return this._raceReject( ctx)
			}

			// get next value, using tools of our our continuation
			const next= ctx.stream.next( ctx.resolve, ctx.reject)

			// check pos. streams can be deleted, which would change pos.
			const pos= this._getStreamPos( ctx)
			// put next into pending
			this.pending[ pos]= next

			// yield up the value
			return ctx.iteration
		}
	},
	_raceReject: {
		value: function _raceReject( ctx){
			
		}
	},
	_getStreamPos: {
		value: function({ pos, stream}){
			// pos is only expected pos. but streams can also move.
			if( this.stream[ pos]=== stream){
				return pos
			}
	
			// calculate position again
			pos= this.stream.indexOf( stream)
			if( pos=== -1){
				throw new Error( "Could not find stream")
			}
			// update our continuations
			if( ctx.resolve){
				ctx.resolve.pos= pos
				ctx.reject.pos= pos
			}
			// return pos
			return pos
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
