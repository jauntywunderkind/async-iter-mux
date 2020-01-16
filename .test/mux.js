import tape from "tape"
import Mux from "../mux.js"
import Fixture012 from "./_fixture_012.js"

tape( "mux", async function( t){
	const
		mux= new Mux(),
		stream= Fixture012()
	mux.add( stream)

})
