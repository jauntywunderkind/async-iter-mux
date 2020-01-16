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
	
			function resolve( iteration){
				return {
					pos,
					iteration,
					stream,
					resolve,
					reject
				}
			}
			function reject( err){
				return {
					pos,
					err,
					stream
				}
			}
	
			// resolve/reject them
			const next= stream.next.then( resolve, reject)
			this.pending.push( next)
			return this
		}
	},

	// next
	_raceResolve: {
		value: function _raceResolve( value){
			
		}
	},
	_raceReject: {
		value: function _raceReject( value){
		}
	},
	next: {
		value: function next( passedIn){
			return Promise.race( this.pending).then( this._raceResolve, this,_raceReject)
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
