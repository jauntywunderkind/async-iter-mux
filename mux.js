import ShimToPolyfill from "shim-to-polyfill"
//const AbortError= ShimToPolyfill( "AbortError", import("@jauntywunderkind/abort-controller"))

export function AsyncIterMux( opt){
	Object.defineProperties( this, {
		// where our wrapped next values will arrive
		pending: {
			value: [],
			writable: true
		},
		// the corresponding array of streams
		stream: {
			value: [],
			writable: true
		},
		_raceResolve: {
			value: this._raceResolve.bind( this)
		},
		_raceReject: {
			value: this._raceReject.bind( this)
		}
	})
	if( opt&& opt.streams){
		this.add( ...opt.streams)
	}
	return this
}
export {
	AsyncIterMux as default,
	AsyncIterMux as mux,
	AsyncIterMux as Mux,
}
AsyncIterMux.prototype= Object.create( null, {
	add: {
		value: function add( stream, ...more){
			// build context for this stream
			const pos= this.stream.length
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
			const next= stream.next().then( resolve, reject)
			// store in pending
			this.pending.push( next)

			if( more.length){
				return this.add( ...more)
			}
			return this
		}
	},

	// next
	_raceResolve: {
		value: function _raceResolve( ctx){
			// check mux for done
			if( this.done){
				return {
					done: true,
					value: undefined
				}
			}

			// check this stream for done
			if( ctx.iteration.done){
				// stream can now be removed & muxing continues
				return this._raceReject( ctx)
			}

			// get next value, using tools of our our continuation
			const next= ctx.stream.next().then( ctx.resolve, ctx.reject)

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
			// already done
			if( this.done){
				return {
					done: true,
					value: undefined
				}
			}

			// remove stream
			const pos= this._getStreamPos( ctx)
			this.stream.splice( pos, 1)
			this.pending.splice( pos, 1)

			// all items have been consumed
			const empty= this._empty()
			if( empty){
				return empty
			}

			// try again
			return this.next()
		}
	},
	_getStreamPos: {
		value: function({ pos, stream, resolve, reject}){
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
			if( resolve){
				resolve.pos= pos
				reject.pos= pos
			}
			// return pos
			return pos
		}
	},
	_empty: {
		value: function _empty(){
			// all items have been consumed
			if( this.stream.length=== 0&& this.terminate!== false){
				this._done()
				return {
					done: true,
					value: undefined
				}
			}
		}
	},
	next: {
		value: function next( passedIn){
			const empty= this._empty()
			if( empty){
				return empty
			}
			return Promise
				.race( this.pending)
				.then( this._raceResolve, this._raceReject)
		}
	},

	// lifecycle methods
	_done: {
		value: function _done(){
			this.done= true
			if( this.cleanup!== false){
				this.pending= null
				this.stream= null
			}
		}
	},
	return: {
		value: function( value){
			this._done()
			return {
				done: true,
				value
			}
		}
	},
	throw: {
		value: function( throwEx){
			this._done()
			if( !throwEx){
				throwEx= new Error()
			}
			throw throwEx
		}
	},
	abort: {
		value: function abort( abortEx){
			return this.throw( abortEx)
		}
	},
	[ Symbol.asyncIterator]: {
		value: function(){
			return this
		}
	}
})
